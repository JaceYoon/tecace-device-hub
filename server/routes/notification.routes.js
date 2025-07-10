const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(requireAuth);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Get web notifications for header badge
router.get('/web', notificationController.getWebNotifications);

// Get all notifications (admin only)
router.get('/all', notificationController.getAllNotifications);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Send return request for device (admin only)
router.post('/return-request', notificationController.sendReturnRequest);

// DEV MODE ONLY: Test endpoints
router.post('/test/create', notificationController.createTestNotification);
router.post('/test/check-expiring', notificationController.checkExpiringDevices);

module.exports = router;