
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

// Configure JSON body parser with increased limit for all device routes
router.use(express.json({ limit: '100mb', extended: true }));
// Add urlencoded parser with increased limit for form data
router.use(express.urlencoded({ limit: '100mb', extended: true }));

// Get all requests endpoint must be before /:id route to avoid conflict
router.get('/requests/all', isAuthenticated, deviceController.findAllRequests);

// Get all devices
router.get('/', isAuthenticated, deviceController.findAll);

// Get a single device
router.get('/:id', isAuthenticated, deviceController.findOne);

// Get device ownership history
router.get('/:id/history', isAuthenticated, deviceController.getDeviceHistory);

// Create a new device
router.post('/', isAuthenticated, isAdmin, deviceController.create);

// Update a device
router.put('/:id', isAuthenticated, deviceController.update);

// Delete a device
router.delete('/:id', isAuthenticated, isAdmin, deviceController.delete);

// Request a device
router.post('/:id/request', isAuthenticated, deviceController.requestDevice);

// Process a device request
router.put('/requests/:id', isAuthenticated, deviceController.processRequest);

// Cancel a device request (only the requester can cancel)
router.put('/requests/:id/cancel', isAuthenticated, deviceController.cancelRequest);

module.exports = router;
