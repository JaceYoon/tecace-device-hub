
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { isAuthenticated, isManager } = require('../middleware/auth.middleware');

// Get all devices
router.get('/', isAuthenticated, deviceController.findAll);

// Get a single device
router.get('/:id', isAuthenticated, deviceController.findOne);

// Create a new device
router.post('/', isAuthenticated, isManager, deviceController.create);

// Update a device
router.put('/:id', isAuthenticated, isManager, deviceController.update);

// Delete a device
router.delete('/:id', isAuthenticated, isManager, deviceController.delete);

// Request a device
router.post('/:id/request', isAuthenticated, deviceController.requestDevice);

// Process a device request
router.put('/requests/:id', isAuthenticated, isManager, deviceController.processRequest);

// Get all requests
router.get('/requests', isAuthenticated, deviceController.findAllRequests);

module.exports = router;
