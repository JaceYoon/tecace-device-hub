const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const sequelize = db.sequelize;

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
const checkForExistingRequest = async (deviceId, transaction) => {
  const existingRequest = await Request.findOne({
    where: {
      deviceId,
      status: 'pending'
    },
    transaction
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
  if (type === 'return' && device.status === 'assigned') {
    return { valid: false, message: 'Device must be released before it can be returned to warehouse' };
  }

  return { valid: true };
};

// Update device status based on request type
const updateDeviceForRequest = async (device, type, userId, transaction) => {
  console.log(`Updating device ${device.id} for ${type} request by user ${userId}`);
  
  // For release requests, mark as pending
  if (type === 'release') {
    await device.update({
      status: 'pending',
      requestedBy: userId
    }, { transaction });
  } else if (type === 'assign') {
    // For assign requests, update the device status to pending and set requestedBy
    console.log(`Setting device ${device.id} to pending status for assignment request`);
    await device.update({
      status: 'pending',
      requestedBy: userId
    }, { transaction });
  } else if (type === 'report' || type === 'return') {
    // For report/return requests, mark the device status as "pending"
    try {
      console.log(`Setting device ${device.id} to pending status for ${type} request`);
      await device.update({
        status: 'pending',
        requestedBy: userId
      }, { transaction });
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error; // Rethrow to trigger transaction rollback
    }
  }
};

// Request a device - optimized with transaction and retry logic
exports.requestDevice = async (req, res) => {
  let transaction;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Fix: Use correct transaction isolation level syntax
      transaction = await sequelize.transaction({
        isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        timeout: 30000 // 30 second timeout
      });
      
      const { type, reportType, reason } = req.body;
      const deviceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('Request device input:', { type, reportType, reason, deviceId, attempt: retryCount + 1 });

      // Validate request type
      const typeValidation = validateRequestType(type, reportType);
      if (!typeValidation.valid) {
        await transaction.rollback();
        return res.status(400).json({ message: typeValidation.message });
      }

      // Find device with lock
      const device = await Device.findByPk(deviceId, { 
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!device) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Device not found' });
      }

      // Check for existing pending request
      const existingRequest = await checkForExistingRequest(device.id, transaction);
      if (existingRequest) {
        await transaction.rollback();
        console.log(`Rejected duplicate request: Device ${device.id} already has a pending request (${existingRequest.id})`);
        return res.status(400).json({ message: 'There is already a pending request for this device' });
      }

      // Validate device status for the request type
      const statusValidation = validateDeviceStatusForRequest(device, type, userId, userRole);
      if (!statusValidation.valid) {
        await transaction.rollback();
        return res.status(400).json({ message: statusValidation.message });
      }

      // All requests are now pending by default
      const status = 'pending';
      
      // Create request
      const request = await Request.create({
        type,
        reportType: type === 'report' ? reportType : null,
        status,
        deviceId: device.id,
        userId,
        reason
      }, { transaction });

      console.log(`Request created with ID ${request.id}, now updating device status`);
      
      // Update device based on request type
      await updateDeviceForRequest(device, type, userId, transaction);
      
      // Commit transaction
      await transaction.commit();
      
      // Format response to ensure IDs are strings
      const formattedRequest = {
        ...request.toJSON(),
        id: String(request.id),
        deviceId: String(request.deviceId),
        userId: String(request.userId)
      };
      
      console.log(`Transaction committed successfully for request ${request.id}`);
      return res.status(201).json(formattedRequest);
      
    } catch (err) {
      // Rollback transaction if it exists
      if (transaction) await transaction.rollback();
      
      // Check if error is due to a lock timeout
      const isLockTimeout = 
        err.message && (
          err.message.includes('Lock wait timeout') || 
          err.message.includes('Deadlock') ||
          err.message.includes('ER_LOCK_WAIT_TIMEOUT') ||
          err.message.includes('ER_LOCK_DEADLOCK')
        );
      
      // If lock timeout and we haven't exceeded retries, try again
      if (isLockTimeout && retryCount < maxRetries - 1) {
        console.log(`Transaction failed due to lock timeout. Retrying (${retryCount + 1}/${maxRetries})...`);
        retryCount++;
        // Wait before retrying to allow locks to clear
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // Otherwise return error
      console.error('Error processing request:', err);
      return res.status(500).json({ message: err.message });
    }
  }
  
  // If we reached here, we've exceeded retries
  return res.status(500).json({ message: 'Transaction failed after multiple retries due to database locks' });
};

// Update device based on processed request
const updateDeviceAfterProcessing = async (device, request, status, transaction) => {
  if (status === 'approved') {
    switch (request.type) {
      case 'assign':
        // Assign device to user
        await device.update({
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: null,
          receivedDate: new Date() // Set received date to now for tracking ownership duration
        }, { transaction });
        break;
        
      case 'release':
        // Regular release
        await device.update({
          status: 'available',
          assignedToId: null,
          requestedBy: null
        }, { transaction });
        break;
        
      case 'report':
        // Handle report based on reportType
        await device.update({
          status: request.reportType || 'missing',
          requestedBy: null,
          assignedToId: null
        }, { transaction });
        break;
        
      case 'return':
        // For return requests, update status to 'returned'
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await device.update({
          status: 'returned',
          returnDate: today,
          requestedBy: null
        }, { transaction });
        break;
    }
  } else if (status === 'rejected') {
    // If request rejected, clear the requestedBy field and reset status
    const statusToRevert = request.type === 'release' ? 'assigned' : 'available';
    await device.update({
      requestedBy: null,
      status: statusToRevert // Reset to assigned for release requests, available for others
    }, { transaction });
  }
};

// Process a device request - optimized with transaction and retry logic
exports.processRequest = async (req, res) => {
  let transaction;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Fix: Use correct transaction isolation level syntax
      transaction = await sequelize.transaction({
        isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        timeout: 30000
      });
      
      const { status } = req.body;
      const requestId = req.params.id;

      if (!['approved', 'rejected'].includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid status' });
      }

      const request = await Request.findByPk(requestId, {
        include: [
          { model: Device, as: 'device' }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!request) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Request not found' });
      }

      const device = await Device.findByPk(request.deviceId, { 
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!device) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Device not found' });
      }

      // Update request
      request.status = status;
      request.processedById = req.user.id;
      request.processedAt = new Date();
      await request.save({ transaction });

      // Update device based on request type and approval status
      await updateDeviceAfterProcessing(device, request, status, transaction);

      // Commit transaction
      await transaction.commit();
      
      // Format response
      const formattedRequest = {
        ...request.toJSON(),
        id: String(request.id),
        deviceId: String(request.deviceId),
        userId: String(request.userId),
        processedById: request.processedById ? String(request.processedById) : null
      };

      return res.json(formattedRequest);
      
    } catch (err) {
      if (transaction) await transaction.rollback();
      
      // Check if error is due to a lock timeout
      const isLockTimeout = 
        err.message && (
          err.message.includes('Lock wait timeout') || 
          err.message.includes('Deadlock') ||
          err.message.includes('ER_LOCK_WAIT_TIMEOUT') ||
          err.message.includes('ER_LOCK_DEADLOCK')
        );
      
      // If lock timeout and we haven't exceeded retries, try again
      if (isLockTimeout && retryCount < maxRetries - 1) {
        console.log(`Process request transaction failed due to lock timeout. Retrying (${retryCount + 1}/${maxRetries})...`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      console.error('Error processing request:', err);
      return res.status(500).json({ message: err.message });
    }
  }
  
  return res.status(500).json({ message: 'Processing request failed after multiple retries due to database locks' });
};

// Cancel a device request - optimized with transaction and retry logic
exports.cancelRequest = async (req, res) => {
  let transaction;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Fix: Use correct transaction isolation level syntax
      transaction = await sequelize.transaction({
        isolationLevel: sequelize.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        timeout: 30000
      });
      
      const requestId = req.params.id;
      const request = await Request.findByPk(requestId, { 
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!request) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Request not found' });
      }

      // Allow both the requester AND admins to cancel requests
      if (request.userId !== req.user.id && req.user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Update request status
      request.status = 'cancelled';
      request.processedById = req.user.id;
      request.processedAt = new Date();
      await request.save({ transaction });

      // Update device with lock
      const device = await Device.findByPk(request.deviceId, { 
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (device) {
        // For release requests, revert to assigned status
        const statusToRevert = request.type === 'release' ? 'assigned' : 'available';
        await device.update({ 
          status: statusToRevert,
          requestedBy: null
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();
      
      // Format response
      const formattedRequest = {
        ...request.toJSON(),
        id: String(request.id),
        deviceId: String(request.deviceId),
        userId: String(request.userId),
        processedById: request.processedById ? String(request.processedById) : null
      };

      return res.json(formattedRequest);
      
    } catch (err) {
      if (transaction) await transaction.rollback();
      
      // Check if error is due to a lock timeout
      const isLockTimeout = 
        err.message && (
          err.message.includes('Lock wait timeout') || 
          err.message.includes('Deadlock') ||
          err.message.includes('ER_LOCK_WAIT_TIMEOUT') ||
          err.message.includes('ER_LOCK_DEADLOCK')
        );
      
      // If lock timeout and we haven't exceeded retries, try again
      if (isLockTimeout && retryCount < maxRetries - 1) {
        console.log(`Cancel request transaction failed due to lock timeout. Retrying (${retryCount + 1}/${maxRetries})...`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      console.error('Error cancelling request:', err);
      return res.status(500).json({ message: err.message });
    }
  }
  
  return res.status(500).json({ message: 'Cancelling request failed after multiple retries due to database locks' });
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

// Find all device requests - optimized query
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
