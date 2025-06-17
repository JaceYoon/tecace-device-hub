
const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const Op = db.Sequelize.Op;

// Create a new device
exports.create = async (req, res) => {
  try {
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, receivedDate, modelNumber, notes, devicePicture } = req.body;

    console.log('Creating device with data:', JSON.stringify({
      ...req.body,
      devicePicture: devicePicture ? '[BASE64_IMAGE_DATA]' : null
    }, null, 2));

    // Validate request
    if (!project || !type || !projectGroup) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Required fields missing (project, type, projectGroup)' });
    }

    // Format receivedDate to remove time part if provided
    let formattedReceivedDate = null;
    if (receivedDate) {
      const date = new Date(receivedDate);
      date.setHours(0, 0, 0, 0);
      formattedReceivedDate = date;
    }

    // Create device with explicit null handling for optional fields
    const deviceData = {
      project,
      projectGroup,
      type,
      deviceType: deviceType || 'C-Type', // Ensure deviceType is set
      imei: imei || null,
      serialNumber: serialNumber || null,
      deviceStatus: deviceStatus || null,
      receivedDate: formattedReceivedDate,
      modelNumber: modelNumber || null,
      notes: notes || null,
      devicePicture: devicePicture || null,
      addedById: req.user ? req.user.id : null,
      status: 'available'
    };

    console.log('Final device data being sent to database:', JSON.stringify(deviceData, null, 2));
    
    // Create device with explicit transaction for better error handling
    const device = await db.sequelize.transaction(async (t) => {
      return await Device.create(deviceData, { transaction: t });
    });

    console.log('Device created successfully:', device.id);

    res.status(201).json(device);
  } catch (err) {
    console.error('Error creating device:', err);
    console.error('Error details:', err.message);
    if (err.name === 'SequelizeValidationError') {
      console.error('Validation errors:', err.errors);
    }
    res.status(500).json({ message: err.message });
  }
};

// Find all devices
exports.findAll = async (req, res) => {
  try {
    const { project, type, status, projectGroup } = req.query;
    let condition = {};

    if (project) condition.project = { [Op.like]: `%${project}%` };
    if (projectGroup) condition.projectGroup = { [Op.like]: `%${projectGroup}%` };
    if (type) condition.type = type;
    if (status) condition.status = status;

    // Regular users shouldn't see missing/stolen devices, but can see dead devices
    // Admins and managers can see all devices
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      condition.status = { [Op.notIn]: ['missing', 'stolen'] };
    }

    console.log("User role:", req.user.role);
    console.log("Applying filter condition:", JSON.stringify(condition));

    const devices = await Device.findAll({
      where: condition,
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    console.log(`Found ${devices.length} devices`);

    // Get all pending requests to identify devices with requests
    const pendingRequests = await Request.findAll({
      where: { status: 'pending' }
    });

    // Map device IDs with pending requests
    const deviceIdsWithPendingRequests = pendingRequests.map(req => req.deviceId);
    
    // Mark devices with pending requests and add assignedToName
    const devicesWithRequestInfo = devices.map(device => {
      const deviceJson = device.toJSON();
      
      // Ensure IDs are consistent strings
      if (deviceJson.id !== undefined) deviceJson.id = String(deviceJson.id);
      if (deviceJson.assignedToId !== undefined) deviceJson.assignedToId = String(deviceJson.assignedToId);
      if (deviceJson.addedById !== undefined) deviceJson.addedById = String(deviceJson.addedById);
      
      // Add assignedToName if there's an assigned user
      if (deviceJson.assignedTo) {
        deviceJson.assignedToName = deviceJson.assignedTo.name;
        // Ensure assignedTo ID is a string for frontend
        if (deviceJson.assignedTo.id !== undefined) {
          deviceJson.assignedTo = String(deviceJson.assignedTo.id);
        }
      }
      
      // Check if this device has pending requests
      const hasPendingRequest = deviceIdsWithPendingRequests.includes(deviceJson.id);
      
      // If has pending request, find the user who requested it
      if (hasPendingRequest) {
        const request = pendingRequests.find(req => String(req.deviceId) === String(deviceJson.id));
        if (request) {
          deviceJson.requestedBy = String(request.userId);
        }
      }
      
      return deviceJson;
    });

    // Debug log devices with assigned users
    const assignedDevices = devicesWithRequestInfo.filter(d => d.assignedTo || d.assignedToId);
    console.log(`Found ${assignedDevices.length} assigned devices:`, 
      assignedDevices.map(d => ({
        id: d.id,
        project: d.project,
        assignedTo: d.assignedTo,
        assignedToId: d.assignedToId,
        assignedToName: d.assignedToName
      }))
    );

    res.json(devicesWithRequestInfo);
  } catch (err) {
    console.error("Error fetching devices:", err);
    res.status(500).json({ message: err.message });
  }
};

// Find a single device
exports.findOne = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Regular users shouldn't see missing/stolen devices but can see dead devices
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && ['missing', 'stolen'].includes(device.status)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if device has pending requests
    const pendingRequest = await Request.findOne({
      where: { 
        deviceId: device.id,
        status: 'pending'
      }
    });

    const deviceJson = device.toJSON();
    
    // Add assignedToName if there's an assigned user
    if (deviceJson.assignedTo) {
      deviceJson.assignedToName = deviceJson.assignedTo.name;
    }
    
    // If device has a pending request, add the requestedBy information
    if (pendingRequest) {
      deviceJson.requestedBy = pendingRequest.userId;
    }

    res.json(deviceJson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const { project, projectGroup, type, deviceType, imei, serialNumber, status, deviceStatus, receivedDate, returnDate, modelNumber, notes, assignedToId, devicePicture } = req.body;
    
    console.log('=== DEVICE UPDATE REQUEST ===');
    console.log('Device ID:', req.params.id);
    console.log('Update request body:', JSON.stringify({
      ...req.body,
      devicePicture: devicePicture ? '[BASE64_IMAGE_DATA]' : 'Not provided'
    }, null, 2));

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      console.log('Device not found:', req.params.id);
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log('Current device data:', {
      id: device.id,
      type: device.type,
      deviceType: device.deviceType,
      project: device.project
    });

    // Validate the type value against allowed ENUM values
    const allowedTypes = ['Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other'];
    if (type && !allowedTypes.includes(type)) {
      console.error('❌ Invalid device type:', type);
      console.error('Allowed types:', allowedTypes);
      return res.status(400).json({ 
        message: `Invalid device type: ${type}. Allowed values: ${allowedTypes.join(', ')}` 
      });
    }

    // Validate deviceType value
    const allowedDeviceTypes = ['C-Type', 'Lunchbox'];
    if (deviceType && !allowedDeviceTypes.includes(deviceType)) {
      console.error('❌ Invalid device type category:', deviceType);
      console.error('Allowed device types:', allowedDeviceTypes);
      return res.status(400).json({ 
        message: `Invalid device type: ${deviceType}. Allowed values: ${allowedDeviceTypes.join(', ')}` 
      });
    }

    console.log('✅ Validation passed for type:', type, 'and deviceType:', deviceType);

    // Format receivedDate to remove time part if provided
    let formattedReceivedDate = receivedDate;
    if (receivedDate) {
      const date = new Date(receivedDate);
      date.setHours(0, 0, 0, 0);
      formattedReceivedDate = date;
    }

    // Format returnDate to remove time part if provided
    let formattedReturnDate = returnDate;
    if (returnDate) {
      const date = new Date(returnDate);
      date.setHours(0, 0, 0, 0);
      formattedReturnDate = date;
    }

    // Only consider it being released if status explicitly changes from assigned to available
    // AND assignedToId is explicitly set to null
    const isBeingReleased = device.status === 'assigned' && 
                            status === 'available' && 
                            device.assignedToId && 
                            assignedToId === null;
    
    // For regular edits, we want to preserve the original assignedToId if it's not explicitly changed
    // Convert string 'null' to actual null value
    const updatedAssignedToId = assignedToId !== undefined ? 
                                (assignedToId === 'null' ? null : assignedToId) : 
                                device.assignedToId;
    
    // For regular edits of assigned devices, keep as assigned
    const updatedStatus = (device.status === 'assigned' && !isBeingReleased) ? 
                          'assigned' : (status || device.status);
    
    // IMPORTANT: Only update devicePicture if it's explicitly provided and not undefined/null
    // This prevents clearing the image when it wasn't changed
    const updatedDevicePicture = devicePicture !== undefined ? devicePicture : device.devicePicture;
    
    // Prepare update data
    const updateData = {
      project: project || device.project,
      projectGroup: projectGroup || device.projectGroup,
      type: type || device.type,
      deviceType: deviceType !== undefined ? deviceType : device.deviceType,
      imei: imei !== undefined ? imei : device.imei,
      serialNumber: serialNumber !== undefined ? serialNumber : device.serialNumber,
      status: updatedStatus,
      deviceStatus: deviceStatus !== undefined ? deviceStatus : device.deviceStatus,
      receivedDate: formattedReceivedDate !== undefined ? formattedReceivedDate : device.receivedDate,
      returnDate: formattedReturnDate !== undefined ? formattedReturnDate : device.returnDate,
      modelNumber: modelNumber !== undefined ? modelNumber : device.modelNumber,
      notes: notes !== undefined ? notes : device.notes,
      devicePicture: updatedDevicePicture,
      assignedToId: updatedAssignedToId
    };

    console.log('=== FINAL UPDATE DATA ===');
    console.log('Update data being applied:', {
      ...updateData,
      devicePicture: updateData.devicePicture ? '[BASE64_IMAGE_DATA]' : 'Not changed'
    });
    
    console.log(`Updating device ${device.id}, keeping image: ${!!updatedDevicePicture}`);
    
    // Update device with transaction for better error handling
    await db.sequelize.transaction(async (t) => {
      await device.update(updateData, { transaction: t });
    });

    console.log('=== DEVICE UPDATED SUCCESSFULLY ===');
    console.log('Updated device data:', {
      id: device.id,
      type: device.type,
      deviceType: device.deviceType,
      project: device.project
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
        processedAt: new Date()
      });
      
      // Mark any previous 'assign' requests as 'returned'
      await Request.update(
        { status: 'returned' },
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
    console.error("=== ERROR UPDATING DEVICE ===");
    console.error("Error updating device:", err);
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);
    if (err.name === 'SequelizeValidationError') {
      console.error('Validation errors:', err.errors);
      // Send more specific error message for validation errors
      const errorMessages = err.errors.map(error => `${error.path}: ${error.message}`);
      return res.status(400).json({ 
        message: `Validation error: ${errorMessages.join(', ')}`,
        details: err.errors
      });
    }
    if (err.name === 'SequelizeDatabaseError' && err.message.includes('Data truncated')) {
      console.error('Database constraint violation - invalid ENUM value');
      return res.status(400).json({ 
        message: 'Invalid value provided for device type. Please check your selection.',
        details: err.message
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete a device
exports.delete = async (req, res) => {
  try {
    console.log('Attempting to delete device with ID:', req.params.id);

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      console.log('Device not found for deletion');
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Delete associated requests first if they exist
    await Request.destroy({ where: { deviceId: device.id } });
    
    // Now delete the device
    await device.destroy();
    console.log('Device successfully deleted');

    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ message: err.message });
  }
};
