
const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;

// Validate request type
const validateRequestType = (type, reportType) => {
  if (!type || !['assign', 'release', 'report', 'return'].includes(type)) {
    return { valid: false, message: 'Invalid request type' };
  }

  // Validate reportType if this is a report request
  if (type === 'report' && (!reportType || !['missing', 'stolen', 'dead'].includes(reportType))) {
    return { valid: false, message: 'Invalid report type' };
  }

  return { valid: true };
};

// Check for existing pending requests
const checkForExistingRequest = async (deviceId) => {
  const existingRequest = await Request.findOne({
    where: {
      deviceId,
      status: 'pending'
    }
  });

  return existingRequest;
};

// Validate device status for specific request types
const validateDeviceStatusForRequest = (device, type, userId, userRole) => {
  // Validate assignment request
  if (type === 'assign' && device.status !== 'available') {
    return { valid: false, message: 'Device is not available' };
  }

  // Validate release request - skip validation for admins
  if (type === 'release' && device.assignedToId !== userId && userRole !== 'admin') {
    return { valid: false, message: 'Device is not assigned to you' };
  }
  
  // Validate return request - only available devices can be returned to warehouse
  // Assigned devices must be released first
  if (type === 'return' && device.status === 'assigned') {
    return { valid: false, message: 'Device must be released before it can be returned to warehouse' };
  }

  return { valid: true };
};

// Update device status based on request type
const updateDeviceForRequest = async (device, type, userId) => {
  console.log(`Updating device ${device.id} for ${type} request by user ${userId}`);
  
  // For release requests, update the device immediately
  if (type === 'release') {
    await device.update({
      status: 'available',
      assignedToId: null,
      requestedBy: null
    });
  } else if (type === 'assign') {
    // For assign requests, ALWAYS update the device status to pending and set requestedBy
    console.log(`Setting device ${device.id} to pending status for assignment request`);
    await device.update({
      status: 'pending',
      requestedBy: userId
    });
  } else if (type === 'report' || type === 'return') {
    // For report/return requests, mark the device status as "pending" to indicate a pending request
    try {
      console.log(`Setting device ${device.id} to pending status for ${type} request`);
      await device.update({
        status: 'pending', // Changed from "available" to "pending" to better reflect the device state
        requestedBy: userId // Keep track of who requested this action
      });
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  }
};

// Request a device
exports.requestDevice = async (req, res) => {
  try {
    const { type, reportType, reason } = req.body;
    const deviceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('Request device input:', { type, reportType, reason, deviceId });

    // Validate request type
    const typeValidation = validateRequestType(type, reportType);
    if (!typeValidation.valid) {
      return res.status(400).json({ message: typeValidation.message });
    }

    // Find device
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check for existing pending request
    const existingRequest = await checkForExistingRequest(device.id);
    if (existingRequest) {
      console.log(`Rejected duplicate request: Device ${device.id} already has a pending request (${existingRequest.id})`);
      return res.status(400).json({ message: 'There is already a pending request for this device' });
    }

    // Validate device status for the request type
    const statusValidation = validateDeviceStatusForRequest(device, type, userId, userRole);
    if (!statusValidation.valid) {
      return res.status(400).json({ message: statusValidation.message });
    }

    // Determine request status (auto-approve release requests)
    let status = 'pending';
    let processedAt = null;
    let processedById = null;
    
    if (type === 'release') {
      status = 'approved';
      processedAt = new Date();
      processedById = userId;
    }

    // Create request
    const request = await Request.create({
      type,
      reportType: type === 'report' ? reportType : null,
      status,
      deviceId: device.id,
      userId,
      processedAt,
      processedById,
      reason
    });

    console.log(`Request created with ID ${request.id}, now updating device status`);
    
    // Update device based on request type
    await updateDeviceForRequest(device, type, userId);
    
    // Verify the device status was updated
    const updatedDevice = await Device.findByPk(deviceId);
    console.log(`Device ${deviceId} status after update: ${updatedDevice.status}`);

    res.status(201).json(request);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update device based on processed request
const updateDeviceAfterProcessing = async (device, request, status) => {
  if (status === 'approved') {
    switch (request.type) {
      case 'assign':
        // Assign device to user
        await device.update({
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: null
        });
        break;
        
      case 'release':
        // Regular release
        await device.update({
          status: 'available',
          assignedToId: null,
          requestedBy: null
        });
        break;
        
      case 'report':
        // Handle report based on reportType
        await device.update({
          status: request.reportType || 'missing',
          requestedBy: null,
          assignedToId: null
        });
        break;
        
      case 'return':
        // For return requests, update status to 'returned'
        // Ensure returnDate is set to the date only (no time component)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await device.update({
          status: 'returned',
          returnDate: today,
          requestedBy: null
        });
        break;
    }
  } else if (status === 'rejected') {
    // If request rejected, clear the requestedBy field and reset status to available
    await device.update({
      requestedBy: null,
      status: 'available' // Always reset to available on reject
    });
  }
};

// Process a device request
exports.processRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findByPk(requestId, {
      include: [
        { model: Device, as: 'device' }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const device = await Device.findByPk(request.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update request
    request.status = status;
    request.processedById = req.user.id;
    request.processedAt = new Date();
    await request.save();

    // Update device based on request type and approval status
    await updateDeviceAfterProcessing(device, request, status);

    res.json(request);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: err.message });
  }
};

// Cancel a device request
exports.cancelRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await Request.findByPk(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the requester or an admin can cancel the request
    if (request.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    request.status = 'cancelled';
    request.processedById = req.user.id;
    request.processedAt = new Date();
    await request.save();

    // Update device
    const device = await Device.findByPk(request.deviceId);
    if (device) {
      // Always update the device status to 'available' when a request is canceled
      await device.update({ 
        status: 'available',
        requestedBy: null
      });
    }

    res.json(request);
  } catch (err) {
    console.error('Error cancelling request:', err);
    res.status(500).json({ message: err.message });
  }
};

// Format request data for response
const formatRequestData = (request) => {
  const requestJson = request.toJSON();
  
  // Ensure IDs are consistent strings
  if (requestJson.id) requestJson.id = String(requestJson.id);
  if (requestJson.deviceId) requestJson.deviceId = String(requestJson.deviceId);
  if (requestJson.userId) requestJson.userId = String(requestJson.userId);
  if (requestJson.processedById) requestJson.processedById = String(requestJson.processedById);
  
  // Add device details
  if (requestJson.device) {
    requestJson.deviceName = requestJson.device.project;
    requestJson.deviceType = requestJson.device.type;
  }
  
  return requestJson;
};

// Find all device requests
exports.findAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        { 
          model: Device, 
          as: 'device',
          attributes: ['id', 'project', 'type', 'serialNumber', 'imei', 'status']
        },
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'email'] 
        },
        { 
          model: User, 
          as: 'processedBy',
          attributes: ['id', 'name', 'email'] 
        }
      ],
      order: [['requestedAt', 'DESC']]
    });

    // Transform the response to ensure consistent data types for IDs
    const formattedRequests = requests.map(formatRequestData);

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ message: err.message });
  }
};
