
const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login route - for local authentication
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Simplified authentication - in a real app, you would verify credentials against DB
  // Here we're just checking if the user exists in our mock data
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
