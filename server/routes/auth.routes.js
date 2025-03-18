
const express = require('express');
const router = express.Router();
const passport = require('passport');
const db = require('../models');
const User = db.user;

// Login route - for local authentication
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Check if we're in forced development mode
  if (process.env.FORCE_DEV_MODE === 'true') {
    // Simplified authentication for development
    if (email.endsWith('@tecace.com')) {
      // For demo purposes - create a mock user object
      const user = {
        id: email === 'admin@tecace.com' ? 'admin-1' : 'user-1',
        email: email,
        name: email === 'admin@tecace.com' ? 'Admin User' : 'Demo User',
        role: email === 'admin@tecace.com' ? 'admin' : 'user'
      };
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error', error: err });
        }
        return res.json({ success: true, user });
      });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    // In production, check against database
    try {
      // Find user by email
      const user = await User.findOne({ where: { email } });
      
      // For simplicity, we're not checking passwords here
      // In a real application, you would hash passwords and compare them
      if (user) {
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login error', error: err });
          }
          return res.json({ 
            success: true, 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            } 
          });
        });
      } else {
        // In development mode, create a user if it doesn't exist
        // This is useful for testing and should be removed in a real app
        if (email.endsWith('@tecace.com')) {
          const newUser = await User.create({
            name: email === 'admin@tecace.com' ? 'Admin User' : 'Demo User',
            email: email,
            role: email === 'admin@tecace.com' ? 'manager' : 'user'
          });
          
          req.login(newUser, (err) => {
            if (err) {
              return res.status(500).json({ message: 'Login error', error: err });
            }
            return res.json({ 
              success: true, 
              user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
              } 
            });
          });
        } else {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ 
      isAuthenticated: true, 
      user: req.user 
    });
  }
  res.json({ isAuthenticated: false });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

module.exports = router;
