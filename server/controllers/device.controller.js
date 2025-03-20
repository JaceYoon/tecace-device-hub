
const db = require('../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const Op = db.Sequelize.Op;

// Create a new device
exports.create = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, deviceStatus, receivedDate, notes } = req.body;

    console.log('Creating device with data:', req.body);

    // Validate request
    if (!project || !type || !projectGroup) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Required fields missing (project, type, projectGroup)' });
    }

    // Create device
    const device = await Device.create({
      project,
      projectGroup,
      type,
      imei: imei || null,
      serialNumber: serialNumber || null,
      deviceStatus,
      receivedDate,
      notes,
      addedById: req.user.id,
      status: 'available'
    });

    console.log('Device created successfully:', device.id);

    res.status(201).json(device);
  } catch (err) {
    console.error('Error creating device:', err);
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
    console.log("Applying filter condition:", condition);

    const devices = await Device.findAll({
      where: condition,
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Get all pending requests to identify devices with requests
    const pendingRequests = await Request.findAll({
      where: { status: 'pending' }
    });

    // Map device IDs with pending requests
    const deviceIdsWithPendingRequests = pendingRequests.map(req => req.deviceId);
    
    // Mark devices with pending requests
    const devicesWithRequestInfo = devices.map(device => {
      const deviceJson = device.toJSON();
      
      // Check if this device has pending requests
      const hasPendingRequest = deviceIdsWithPendingRequests.includes(deviceJson.id);
      
      // If has pending request, find the user who requested it
      if (hasPendingRequest) {
        const request = pendingRequests.find(req => req.deviceId === deviceJson.id);
        if (request) {
          deviceJson.requestedBy = request.userId;
        }
      }
      
      return deviceJson;
    });

    console.log(`Found ${devices.length} devices`);
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
    const { project, projectGroup, type, imei, serialNumber, status, deviceStatus, receivedDate, notes, assignedToId } = req.body;

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
        await device.update({
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: null
        });
      } else if (request.type === 'release') {
        await device.update({
          status: 'available',
          assignedToId: null,
          requestedBy: null
        });
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

// Find all requests
exports.findAllRequests = async (req, res) => {
  try {
    let condition = {};

    // Regular users should only see their own requests
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      condition.userId = req.user.id;
    }

    console.log("User role for requests:", req.user.role);
    console.log("Request condition:", condition);

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
