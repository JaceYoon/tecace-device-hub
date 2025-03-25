
const db = require('../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const OwnershipHistory = db.ownershipHistory;
const { Op } = require('sequelize');

// Get all devices
exports.findAll = async (req, res) => {
  try {
    const devices = await Device.findAll({
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'addedBy', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(devices);
  } catch (err) {
    console.error('Error getting all devices:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single device
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
    res.json(device);
  } catch (err) {
    console.error('Error getting device:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new device
exports.create = async (req, res) => {
  try {
    const device = await Device.create({
      ...req.body,
      addedById: req.user.id
    });
    res.status(201).json(device);
  } catch (err) {
    console.error('Error creating device:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    await device.update(req.body);
    res.json(device);
  } catch (err) {
    console.error('Error updating device:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a device
exports.delete = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    await device.destroy();
    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all requests
exports.findAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        { model: Device, as: 'device' },
        { model: User, as: 'user' },
        { model: User, as: 'processedBy' }
      ]
    });
    res.json(requests);
  } catch (err) {
    console.error('Error getting all requests:', err);
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
    
    // Check if device is available (for assign) or assigned to the user (for release)
    if (type === 'assign' && device.status !== 'available') {
      return res.status(400).json({ message: 'Device is not available' });
    }
    
    if (type === 'release' && 
        (device.status !== 'assigned' || device.assignedToId !== req.user.id)) {
      return res.status(400).json({ message: 'You cannot release a device that is not assigned to you' });
    }
    
    // Check if there's an existing pending request
    const existingRequest = await Request.findOne({
      where: {
        deviceId: device.id,
        status: 'pending'
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'There is already a pending request for this device' });
    }
    
    // Mark the device as requested
    await device.update({
      requestedBy: req.user.id
    });
    
    // Create a new request
    const request = await Request.create({
      deviceId: device.id,
      userId: req.user.id,
      type,
      status: 'pending',
      requestedAt: new Date()
    });
    
    // Return the request with associations
    const newRequest = await Request.findByPk(request.id, {
      include: [
        { model: Device, as: 'device' },
        { model: User, as: 'user' }
      ]
    });
    
    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Error requesting device:', err);
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

// Cancel a device request
exports.cancelRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Only the requester can cancel their own request
    if (request.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }
    
    // Update request status
    await request.update({
      status: 'cancelled',
      processedAt: new Date()
    });
    
    // Clear the requestedBy field on the device
    const device = await Device.findByPk(request.deviceId);
    await device.update({
      requestedBy: null
    });
    
    res.json(request);
  } catch (err) {
    console.error('Error cancelling request:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get device ownership history
exports.getDeviceHistory = async (req, res) => {
  try {
    const history = await OwnershipHistory.findAll({
      where: {
        deviceId: req.params.id
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'releasedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['assignedAt', 'DESC']]
    });
    
    res.json(history);
  } catch (err) {
    console.error('Error getting device history:', err);
    res.status(500).json({ message: err.message });
  }
};
