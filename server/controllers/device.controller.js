
// Process a device request
exports.processRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findByPk(req.params.id, {
      include: [
        { model: Device, as: 'device' },
        { model: User, as: 'user' }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update request
    await request.update({
      status,
      processedById: req.user.id,
      processedAt: new Date()
    });

    // If approved, update device
    if (status === 'approved') {
      const device = await Device.findByPk(request.deviceId);

      if (request.type === 'assign') {
        const previousAssignedToId = device.assignedToId;
        
        // Update device assignment
        await device.update({
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: null
        });
        
        // Create new ownership history entry
        await OwnershipHistory.create({
          deviceId: device.id,
          userId: request.userId,
          assignedAt: new Date()
        });
        
        // If this device was previously assigned to someone else, update their history record
        if (previousAssignedToId) {
          const previousHistory = await OwnershipHistory.findOne({
            where: {
              deviceId: device.id,
              userId: previousAssignedToId,
              releasedAt: null
            }
          });
          
          if (previousHistory) {
            await previousHistory.update({
              releasedAt: new Date(),
              releasedById: req.user.id,
              releaseReason: 'Reassigned to another user'
            });
          }
        }
      } else if (request.type === 'release') {
        // Update device status
        await device.update({
          status: 'available',
          assignedToId: null,
          requestedBy: null
        });
        
        // Update ownership history to mark release
        const history = await OwnershipHistory.findOne({
          where: {
            deviceId: device.id,
            userId: request.userId,
            releasedAt: null
          }
        });
        
        if (history) {
          await history.update({
            releasedAt: new Date(),
            releasedById: req.user.id,
            releaseReason: 'User requested release'
          });
        }
      }
    } else {
      // If rejected, just clear the requestedBy field
      const device = await Device.findByPk(request.deviceId);
      await device.update({
        requestedBy: null
      });
    }

    // Reload the request with associations to send back
    const processedRequest = await Request.findByPk(request.id, {
      include: [
        { model: Device, as: 'device' },
        { model: User, as: 'user' },
        { model: User, as: 'processedBy' }
      ]
    });

    res.json(processedRequest);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: err.message });
  }
};
