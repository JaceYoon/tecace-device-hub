
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuthenticated, isManager } = require('../middleware/auth.middleware');

// Get all users
router.get('/', isAuthenticated, userController.findAll);

// Get current user
router.get('/me', isAuthenticated, userController.findMe);

// Get user by ID
router.get('/:id', isAuthenticated, userController.findOne);

// Update user role (manager only)
router.put('/:id/role', isAuthenticated, isManager, userController.updateRole);

module.exports = router;
