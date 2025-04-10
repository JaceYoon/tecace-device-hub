
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
    console.error('Error updating profile:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    console.log('Password update request for user ID:', req.params.id);
    
    // Check if user is updating their own password
    const requestedUserId = String(req.params.id);
    const currentUserId = String(req.user.id);
    
    if (currentUserId !== requestedUserId) {
      console.log('Authorization failed: User can only update their own password');
      return res.status(403).json({ message: 'You can only update your own password' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }
    
    // Find the user
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    await user.update({
      password: hashedPassword
    });
    
    console.log('Password updated successfully for user ID:', req.params.id);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update user role (admin only)
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'TPM', 'Software Engineer'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role' 
      });
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
