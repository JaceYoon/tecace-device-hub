
const db = require('../models');
const User = db.user;
const bcrypt = require('bcrypt');

// Find all users
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find current user
exports.findMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find user by ID
exports.findOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Profile update request for user ID:', req.params.id);
    console.log('Current user ID:', req.user.id);
    console.log('Current user role:', req.user.role);
    
    // Check if user is updating their own profile OR if they're an admin
    // Convert both IDs to strings before comparison to handle different data types
    const requestedUserId = String(req.params.id);
    const currentUserId = String(req.user.id);
    
    if (currentUserId !== requestedUserId && req.user.role !== 'admin') {
      console.log('Authorization failed: User can only update their own profile');
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    const { name, avatarUrl } = req.body;
    
    // Find the user
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the user profile
    const updatedUser = await user.update({
      name: name || user.name,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl
    });
    
    console.log('User profile updated successfully for ID:', req.params.id);
    
    // Return the updated user without the password
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
      active: updatedUser.active
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update user role
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Verify that role is one of the allowed values
    if (!role || !['user', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent changing admin roles
    if (user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Cannot change role for admin accounts' 
      });
    }
    
    await user.update({ role });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      active: user.active
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
