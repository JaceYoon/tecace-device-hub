
const db = require('../../models');
const Device = db.device;
const Request = db.request;

// Request a device return
exports.requestDeviceReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    const deviceId = req.params.id;

    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if there's already a pending request
    const existingRequest = await Request.findOne({
      where: {
        deviceId: device.id,
        status: 'pending',
        type: 'return'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'There is already a pending return request for this device' 
      });
    }

    // Validate return request - only available devices can be returned
    if (device.status === 'assigned') {
      return res.status(400).json({ 
        message: 'Device must be released before it can be returned to warehouse' 
      });
    }

    // Create return request
    const request = await Request.create({
      type: 'return',
      status: 'pending',
      deviceId: device.id,
      userId: req.user.id,
      reason: reason || 'Device returned to warehouse'
    });

    // Mark device as pending
    await device.update({
      status: 'available', // Use "available" status code due to DB constraints
      requestedBy: req.user.id 
    });

    res.status(201).json(request);
  } catch (err) {
    console.error('Error processing return request:', err);
    res.status(500).json({ message: err.message });
  }
};

// Confirm a device return
exports.confirmDeviceReturn = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { returnDate } = req.body;
    
    const request = await Request.findByPk(requestId, {
      include: [{ model: Device, as: 'device' }]
    });

    if (!request || request.type !== 'return') {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not in pending status' });
    }

    const device = await Device.findByPk(request.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update request status
    await request.update({
      status: 'approved',
      processedById: req.user.id,
      processedAt: new Date()
    });

    // Format return date or use today
    let formattedReturnDate;
    if (returnDate) {
      formattedReturnDate = new Date(returnDate);
    } else {
      formattedReturnDate = new Date();
    }
    // Ensure date only (no time component)
    formattedReturnDate.setHours(0, 0, 0, 0);

    // Update device to returned status
    await device.update({
      status: 'returned',
      returnDate: formattedReturnDate,
      requestedBy: null
    });

    res.json({ 
      message: 'Return confirmed successfully', 
      request, 
      device 
    });
  } catch (err) {
    console.error('Error confirming device return:', err);
    res.status(500).json({ message: err.message });
  }
};

// Cancel a device return request
exports.cancelDeviceReturnRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await Request.findByPk(requestId);

    if (!request || request.type !== 'return') {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Only the requester or an admin can cancel
    if (request.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    await request.update({
      status: 'cancelled',
      processedById: req.user.id,
      processedAt: new Date()
    });

    // Update device
    const device = await Device.findByPk(request.deviceId);
    if (device) {
      await device.update({ 
        requestedBy: null,
        status: 'available'
      });
    }

    res.json({ message: 'Return request cancelled successfully', request });
  } catch (err) {
    console.error('Error cancelling return request:', err);
    res.status(500).json({ message: err.message });
  }
};
