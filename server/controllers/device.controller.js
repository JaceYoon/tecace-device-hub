const db = require('../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const Op = db.Sequelize.Op;

// Create a new device
exports.create = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, deviceStatus, receivedDate, notes, devicePicture } = req.body;

    console.log('Creating device with data:', JSON.stringify(req.body, null, 2));

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
      imei: imei || null,
      serialNumber: serialNumber || null,
      deviceStatus: deviceStatus || null,
      receivedDate: formattedReceivedDate,
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
    
    // Get ownership history from the Requests table
    const history = await Request.findAll({
      where: { 
        deviceId,
        type: ['assign', 'release'],
        status: ['approved', 'returned'] // Include both approved and returned requests
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'processedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['processedAt', 'DESC']]
    });
    
    // Transform request data to match ownership history format
    const historyWithNames = history.map(entry => {
      const entryJson = entry.toJSON();
      
      // Create a formatted history entry from request data
      const historyEntry = {
        id: String(entryJson.id),
        deviceId: String(entryJson.deviceId),
        userId: String(entryJson.userId),
        userName: entryJson.user ? entryJson.user.name : 'Unknown User',
        // For an assign request, this is when it was assigned
        assignedAt: entryJson.type === 'assign' ? entryJson.processedAt : null,
        // For a release request, this is when it was released
        releasedAt: entryJson.type === 'release' ? entryJson.processedAt : null,
        releasedById: entryJson.type === 'release' ? String(entryJson.processedById) : null,
        releasedByName: entryJson.type === 'release' && entryJson.processedBy ? entryJson.processedBy.name : null,
        releaseReason: entryJson.type === 'release' ? entryJson.reason || 'User requested release' : null
      };
      
      return historyEntry;
    });
    
    // Add current assignment if not already in the history
    if (device.assignedToId) {
      // Find the user who currently has the device
      const assignedUser = await User.findByPk(device.assignedToId);
      
      // Check if there's already an entry for the current assignment
      const hasCurrentAssignment = historyWithNames.some(
        entry => entry.userId === String(device.assignedToId) && !entry.releasedAt
      );
      
      if (assignedUser && !hasCurrentAssignment) {
        // Add the current assignment to the history
        historyWithNames.unshift({
          id: `current-${deviceId}`,
          deviceId: String(deviceId),
          userId: String(device.assignedToId),
          userName: assignedUser.name,
          assignedAt: device.updatedAt,
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
          releaseReason: null
        });
      }
    }
    
    console.log(`Returning ${historyWithNames.length} history entries for device ${deviceId}`);
    res.json(historyWithNames);
  } catch (err) {
    console.error("Error fetching device history:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update a device
exports.update = async (req, res) => {
  try {
    const { project, projectGroup, type, imei, serialNumber, status, deviceStatus, receivedDate, returnDate, notes, assignedToId, devicePicture } = req.body;

    const device = await Device.findByPk(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

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
    
    // Update device
    await device.update({
      project: project || device.project,
      projectGroup: projectGroup || device.projectGroup,
      type: type || device.type,
      imei: imei !== undefined ? imei : device.imei,
      serialNumber: serialNumber !== undefined ? serialNumber : device.serialNumber,
      status: updatedStatus,
      deviceStatus: deviceStatus !== undefined ? deviceStatus : device.deviceStatus,
      receivedDate: formattedReceivedDate !== undefined ? formattedReceivedDate : device.receivedDate,
      returnDate: formattedReturnDate !== undefined ? formattedReturnDate : device.returnDate,
      notes: notes !== undefined ? notes : device.notes,
      devicePicture: devicePicture !== undefined ? devicePicture : device.devicePicture,
      assignedToId: updatedAssignedToId
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
    console.error("Error updating device:", err);
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

// Request a device
exports.requestDevice = async (req, res) => {
  try {
    const { type, reportType, reason } = req.body;

    console.log('Request device input:', { type, reportType, reason, deviceId: req.params.id });

    if (!type || !['assign', 'release', 'report', 'return'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    // Special case for return requests - check if reason has [RETURN] prefix
    const isReturnRequest = type === 'return' || (reason && reason.includes('[RETURN]'));
    
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
      return res.status(400).json({ message: 'There is already a pending request for this device' });
    }

    // Validate assignment request
    if (type === 'assign' && device.status !== 'available') {
      return res.status(400).json({ message: 'Device is not available' });
    }

    // Validate release request - skip validation for admins
    if (type === 'release' && !isReturnRequest && device.assignedToId !== req.user.id && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Device is not assigned to you' });
    }
    
    // Validate return request - only available devices can be returned to warehouse
    // Assigned devices must be released first
    if (isReturnRequest && device.status === 'assigned') {
      return res.status(400).json({ message: 'Device must be released before it can be returned to warehouse' });
    }

    // Auto-approve release requests (for any user, including admin)
    let status = 'pending';
    let processedAt = null;
    let processedById = null;
    
    if (type === 'release' && !isReturnRequest) {
      status = 'approved';
      processedAt = new Date();
      processedById = req.user.id;
    }

    // For return requests using our workaround, keep them pending
    if (isReturnRequest) {
      // If using 'release' type with [RETURN] reason, keep as pending
      status = 'pending';
      processedAt = null;
      processedById = null;
    }

    // Create request - handle return requests special case for older systems
    // Use 'release' as the type for return requests (workaround)
    const requestType = type === 'return' ? 'release' : type;
    
    // Set a simple [RETURN] reason for return requests, otherwise use provided reason
    const finalReason = isReturnRequest ? '[RETURN]' : reason;
    
    const request = await Request.create({
      type: requestType,
      reportType: type === 'report' ? reportType : null,
      status,
      deviceId: device.id,
      userId: req.user.id,
      processedAt,
      processedById,
      reason: finalReason
    });

    // If it's a release request, update the device immediately
    if (type === 'release' && !isReturnRequest) {
      await device.update({
        status: 'available',
        assignedToId: null,
        requestedBy: null
      });
    } else if (type === 'assign') {
      // Update the device to indicate it has a pending request
      device.requestedBy = req.user.id;
      await device.save();
    } else if (type === 'report' || isReturnRequest) {
      // For report/return requests, mark the device as pending right away
      try {
        await device.update({
          status: 'pending',
          requestedBy: req.user.id
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

    // Check if this is a return request (has [RETURN] reason)
    const isReturnRequest = request.reason && request.reason.includes('[RETURN]');

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
        if (isReturnRequest) {
          // For return requests, update status to 'returned'
          // Ensure returnDate is set to the date only (no time component)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          await device.update({
            status: 'returned',
            returnDate: today,
            requestedBy: null
          });
        } else {
          // Regular release
          await device.update({
            status: 'available',
            assignedToId: null,
            requestedBy: null
          });
        }
      } else if (request.type === 'report') {
        // Handle report based on reportType
        await device.update({
          status: request.reportType || 'missing',
          requestedBy: null,
          assignedToId: null
        });
      }
    } else if (status === 'rejected') {
      // If request rejected, just clear the requestedBy field
      await device.update({
        requestedBy: null,
        status: device.status === 'pending' ? 'available' : device.status
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
