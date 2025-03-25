
const db = require('../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const OwnershipHistory = db.ownershipHistory;
const Op = db.Sequelize.Op;

// Create a new device
exports.create = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, deviceStatus, receivedDate, notes, barcode } = req.body;

    console.log('Creating device with data:', JSON.stringify(req.body, null, 2));

    // Validate request
    if (!project || !type || !projectGroup) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Required fields missing (project, type, projectGroup)' });
    }

    // Create device with explicit null handling for optional fields
    const deviceData = {
      project,
      projectGroup,
      type,
      imei: imei || null,
      serialNumber: serialNumber || null,
      deviceStatus: deviceStatus || null,
      receivedDate: receivedDate || null,
      notes: notes || null,
      barcode: barcode || null,
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

    // Regular users shouldn't see missing/stolen devices, but managers and admins should
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

    // Regular users shouldn't see missing/stolen devices (unless they're managers)
    if (req.user.role !== 'manager' && ['missing', 'stolen'].includes(device.status)) {
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

// Get device ownership history
exports.getDeviceHistory = async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Verify the device exists
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Get ownership history for this device
    const history = await OwnershipHistory.findAll({
      where: { deviceId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'releasedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['assignedAt', 'DESC']]
    });
    
    const historyWithNames = history.map(entry => {
      const entryJson = entry.toJSON();
      // Add user name for easier display
      if (entryJson.user) {
        entryJson.userName = entryJson.user.name;
      }
      // Add released by name if available
      if (entryJson.releasedBy) {
        entryJson.releasedByName = entryJson.releasedBy.name;
      }
      return entryJson;
    });
    
    res.json(historyWithNames);
  } catch (err) {
    console.error("Error fetching device history:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, status, deviceStatus, receivedDate, notes, assignedToId, barcode } = req.body;

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

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
      barcode: barcode !== undefined ? barcode : device.barcode,
      assignedToId: assignedToId !== undefined ? assignedToId : device.assignedToId
    });

    res.json(device);
  } catch (err) {
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

    // Check if there are any requests associated with this device
    const associatedRequests = await Request.findAll({
      where: { deviceId: device.id }
    });

    // Delete associated requests first if they exist
    if (associatedRequests.length > 0) {
      console.log(`Deleting ${associatedRequests.length} associated requests`);
      await Request.destroy({ where: { deviceId: device.id } });
    }
    
    // Delete ownership history records
    await OwnershipHistory.destroy({ where: { deviceId: device.id } });

    // Now delete the device
    await device.destroy();
    console.log('Device successfully deleted');

    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ message: err.message });
  }
};

// Request a device
exports.requestDevice = async (req, res) => {
  try {
    const { type } = req.body; // 'assign' or 'release'

    if (!type || !['assign', 'release'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if there's already a pending request for this device
    const existingRequest = await Request.findOne({
      where: {
        deviceId: device.id,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'There is already a pending request for this device' });
    }

    // Validate request
    if (type === 'assign' && device.status !== 'available') {
      return res.status(400).json({ message: 'Device is not available' });
    }

    if (type === 'release' && device.assignedToId !== req.user.id) {
      return res.status(400).json({ message: 'Device is not assigned to you' });
    }

    // Create request
    const request = await Request.create({
      type,
      deviceId: device.id,
      userId: req.user.id
    });

    // Update the device to indicate it has a pending request
    if (type === 'assign') {
      device.requestedBy = req.user.id;
      await device.save();
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Process a device request
exports.processRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findByPk(req.params.id, {
      include: [
        { model: Device },
        { model: User }
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

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel a device request
exports.cancelRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id, {
      include: [
        { model: Device }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    // Users can only cancel their own requests
    if (request.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }

    // Update request
    await request.update({
      status: 'cancelled',
      processedById: req.user.id,
      processedAt: new Date()
    });

    // Clear the requestedBy field on the device
    const device = await Device.findByPk(request.deviceId);
    if (device) {
      await device.update({
        requestedBy: null
      });
    }

    res.json(request);
  } catch (err) {
    console.error("Error cancelling request:", err);
    res.status(500).json({ message: err.message });
  }
};

// Find all requests
exports.findAllRequests = async (req, res) => {
  try {
    let condition = {};

    // Regular users should only see their own requests
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      condition.userId = req.user.id;
    }

    console.log("User role for requests:", req.user.role);
    console.log("Request condition:", JSON.stringify(condition));

    const requests = await Request.findAll({
      where: condition,
      include: [
        { model: Device },
        { model: User },
        { model: User, as: 'processedBy' }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${requests.length} requests`);
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: err.message });
  }
};
