
const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;

// Request a device
exports.requestDevice = async (req, res) => {
  try {
    const { type, reportType, reason } = req.body;

    console.log('Request device input:', { type, reportType, reason, deviceId: req.params.id });

    if (!type || !['assign', 'release', 'report', 'return'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    // Validate reportType if this is a report request
    if (type === 'report' && (!reportType || !['missing', 'stolen', 'dead'].includes(reportType))) {
      return res.status(400).json({ message: 'Invalid report type' });
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
      console.log(`Rejected duplicate request: Device ${device.id} already has a pending request (${existingRequest.id})`);
      return res.status(400).json({ message: 'There is already a pending request for this device' });
    }

    // Validate assignment request
    if (type === 'assign' && device.status !== 'available') {
      return res.status(400).json({ message: 'Device is not available' });
    }

    // Validate release request - skip validation for admins
    if (type === 'release' && device.assignedToId !== req.user.id && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Device is not assigned to you' });
    }
    
    // Validate return request - only available devices can be returned to warehouse
    // Assigned devices must be released first
    if (type === 'return' && device.status === 'assigned') {
      return res.status(400).json({ message: 'Device must be released before it can be returned to warehouse' });
    }

    // Auto-approve release requests (for any user, including admin)
    let status = 'pending';
    let processedAt = null;
    let processedById = null;
    
    if (type === 'release') {
      status = 'approved';
      processedAt = new Date();
      processedById = req.user.id;
    }

    // Create request with the exact type specified
    const request = await Request.create({
      type: type, // Use the actual type passed in (including 'return')
      reportType: type === 'report' ? reportType : null,
      status,
      deviceId: device.id,
      userId: req.user.id,
      processedAt,
      processedById,
      reason: reason
    });

    // If it's a release request, update the device immediately
    if (type === 'release') {
      await device.update({
        status: 'available',
        assignedToId: null,
        requestedBy: null
      });
    } else if (type === 'assign') {
      // Update the device to indicate it has a pending request
      device.requestedBy = req.user.id;
      await device.save();
    } else if (type === 'report' || type === 'return') {
      // For report/return requests, mark the device status as "available" but with a requestedBy
      // This works around database constraints but still allows us to identify pending devices
      try {
        await device.update({
          status: 'available', // Use "available" instead of "pending" to avoid database constraint errors
          requestedBy: req.user.id // Keep track of who requested this action
        });
      } catch (error) {
        console.error('Error updating device status:', error);
      }
    }

    res.status(201).json(request);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: err.message });
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

    // Handle device updates based on request type and status
    if (status === 'approved') {
      if (request.type === 'assign') {
        // Assign device to user
        await device.update({
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: null
        });
      } else if (request.type === 'release') {
        // Regular release
        await device.update({
          status: 'available',
          assignedToId: null,
          requestedBy: null
        });
      } else if (request.type === 'report') {
        // Handle report based on reportType
        await device.update({
          status: request.reportType || 'missing',
          requestedBy: null,
          assignedToId: null
        });
      } else if (request.type === 'return') {
        // For return requests, update status to 'returned'
        // Ensure returnDate is set to the date only (no time component)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await device.update({
          status: 'returned',
          returnDate: today,
          requestedBy: null
        });
      }
    } else if (status === 'rejected') {
      // If request rejected, clear the requestedBy field and reset status to available
      await device.update({
        requestedBy: null,
        status: 'available' // Always reset to available on reject
      });
    }

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
      // Clear requestedBy and update status from 'pending' to 'available' if needed
      const updates = { 
        requestedBy: null
      };
      
      // If device is in pending status and this is a return/report request, reset to available
      if (device.status === 'pending') {
        const isReturnRequest = request.reason && request.reason.includes('[RETURN]');
        if (isReturnRequest || request.type === 'report') {
          updates.status = 'available';
        }
      }
      
      await device.update(updates);
    }

    res.json(request);
  } catch (err) {
    console.error('Error cancelling request:', err);
    res.status(500).json({ message: err.message });
  }
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
    const formattedRequests = requests.map(request => {
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
    });

    res.json(formattedRequests);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ message: err.message });
  }
};
