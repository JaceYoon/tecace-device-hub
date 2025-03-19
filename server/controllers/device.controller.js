
const db = require('../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const Op = db.Sequelize.Op;

// Create a new device
exports.create = async (req, res) => {
  try {
    const { name, type, imei, serialNumber, notes } = req.body;

    console.log('Creating device with data:', req.body);

    // Validate request
    if (!name || !type || !imei || !serialNumber) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Create device
    const device = await Device.create({
      name,
      type,
      imei,
      serialNumber,
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
    const { name, type, status } = req.query;
    let condition = {};

    if (name) condition.name = { [Op.like]: `%${name}%` };
    if (type) condition.type = type;
    if (status) condition.status = status;

    // Regular users shouldn't see missing/stolen devices (unless they're managers)
    if (req.user.role !== 'manager') {
      condition.status = { [Op.notIn]: ['missing', 'stolen'] };
    }

    const devices = await Device.findAll({
      where: condition,
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(devices);
  } catch (err) {
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

    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const { name, type, imei, serialNumber, status, notes, assignedToId } = req.body;

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update device
    await device.update({
      name: name || device.name,
      type: type || device.type,
      imei: imei || device.imei,
      serialNumber: serialNumber || device.serialNumber,
      status: status || device.status,
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
          assignedToId: request.userId
        });
      } else if (request.type === 'release') {
        await device.update({
          status: 'available',
          assignedToId: null
        });
      }
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
    if (req.user.role !== 'manager') {
      condition.userId = req.user.id;
    }

    const requests = await Request.findAll({
      where: condition,
      include: [
        { model: Device },
        { model: User },
        { model: User, as: 'processedBy' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
