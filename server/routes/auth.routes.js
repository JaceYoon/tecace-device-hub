
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const db = require('../models');
const User = db.user;

// Login route
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for email:', email);
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password - CRITICAL security fix
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User authenticated successfully:', email);
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        console.error('Login error after authentication:', err);
        return res.status(500).json({ message: 'Login error', error: err });
      }
      
      console.log('User session created for:', email);
      
      return res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        } 
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Microsoft OAuth routes
router.get('/microsoft', 
  passport.authenticate('microsoft', {
    scope: ['user.read']
  })
);

router.get('/microsoft/callback', 
  passport.authenticate('microsoft', { 
    failureRedirect: '/?error=oauth_failed' 
  }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    console.log('Microsoft OAuth successful for user:', req.user.email);
    res.redirect('/dashboard');
  }
);

// Register route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  
  try {
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user' // Default role
    });
    
    // Log in the new user
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login error after registration', error: err });
      }
      return res.status(201).json({ 
        success: true, 
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl
        } 
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    // Make sure to always include avatarUrl in the response
    return res.json({ 
      isAuthenticated: true, 
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl
      }
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
