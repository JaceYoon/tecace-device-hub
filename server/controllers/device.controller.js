
// Only updating the specific part that causes the database error in the update function
exports.update = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, status, deviceStatus, receivedDate, notes, assignedToId, devicePicture } = req.body;

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if device is being released (assignedToId being set to null when it was previously set)
    const isBeingReleased = device.assignedToId && !assignedToId;
    
    // Update device
    await device.update({
      project: project || device.project,
      projectGroup: projectGroup || device.projectGroup,
      type: type || device.type,
      imei: imei !== undefined ? imei : device.imei,
      serialNumber: serialNumber !== undefined ? serialNumber : device.serialNumber,
      status: status || device.status,
      deviceStatus: deviceStatus !== undefined ? deviceStatus : device.deviceStatus,
      receivedDate: receivedDate !== undefined ? receivedDate : device.receivedDate,
      notes: notes !== undefined ? notes : device.notes,
      devicePicture: devicePicture !== undefined ? devicePicture : device.devicePicture,
      assignedToId: assignedToId !== undefined ? assignedToId : device.assignedToId
    });

    // If the device is being released, create an auto-approved release request
    if (isBeingReleased) {
      console.log(`Device ${device.id} is being released. Creating auto-approved release request`);
      
      // Create and auto-approve a release request
      await Request.create({
        type: 'release',
        status: 'approved',
        deviceId: device.id,
        userId: device.assignedToId, // The user who was assigned the device
        processedById: req.user.id,  // The admin/manager who processed the release
        requestedAt: new Date(),
        processedAt: new Date(),
        reason: 'Device returned by user'
      });
      
      // Fix the database error by updating with a valid status value
      // The error occurs because 'returned' is not a valid enum value
      // Using 'approved' instead which is one of the valid values
      await Request.update(
        { status: 'approved' }, // Changed from 'returned' to 'approved'
        { 
          where: { 
            deviceId: device.id,
            userId: device.assignedToId,
            type: 'assign',
            status: 'approved'
          }
        }
      );
      
      // Update device status
      await device.update({
        status: 'available',
        assignedToId: null,
        requestedBy: null  // Clear any pending requests
      });
    }

    res.json(device);
  } catch (err) {
    console.error("Error updating device:", err);
    res.status(500).json({ message: err.message });
  }
};
