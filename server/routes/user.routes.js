
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

// Get all users
router.get('/', isAuthenticated, userController.findAll);

// Get current user
router.get('/me', isAuthenticated, userController.findMe);

// Get user by ID
router.get('/:id', isAuthenticated, userController.findOne);

// Update user profile - anyone authenticated can access, but controller will check permissions
router.put('/:id/profile', isAuthenticated, userController.updateProfile);

// Update user password - user can only update their own password
router.put('/:id/password', isAuthenticated, userController.updatePassword);

// Update user role (admin only)
router.put('/:id/role', isAuthenticated, isAdmin, userController.updateRole);

module.exports = router;
