
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const db = require('../models');

// Check if we're in force dev mode
const FORCE_DEV_MODE = process.env.FORCE_DEV_MODE === 'true';

// Only get User model if not in dev mode
const User = FORCE_DEV_MODE ? null : db.user;

// Login route
router.post('/login', async (req, res, next) => {
  if (FORCE_DEV_MODE) {
    // Dev mode login simulation
    const { email, password } = req.body;
    console.log('DEV MODE: Login attempt for email:', email);
    
    if (email === 'admin@tecace.com' && password === 'admin123') {
      const mockUser = {
        id: '1',
        name: 'Administrator',
        email: 'admin@tecace.com',
        role: 'admin',
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=admin'
      };
      
      req.login(mockUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error', error: err });
        }
        return res.json({ success: true, user: mockUser });
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return;
  }

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

// Microsoft OAuth routes - Always enabled regardless of dev mode
console.log('Setting up Microsoft OAuth routes...');

router.get('/microsoft', (req, res, next) => {
  console.log('Microsoft OAuth route hit');
  
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    console.log('Microsoft OAuth not configured');
    return res.status(501).json({ 
      message: 'Microsoft OAuth is not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in your environment variables.' 
    });
  }
  
  passport.authenticate('microsoft', {
    scope: ['user.read']
  })(req, res, next);
});

router.get('/microsoft/callback', (req, res, next) => {
  console.log('Microsoft OAuth callback hit');
  
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    console.log('Microsoft OAuth not configured for callback');
    return res.redirect('/?error=oauth_not_configured');
  }
  
  passport.authenticate('microsoft', { 
    failureRedirect: '/?error=oauth_failed' 
  })(req, res, next);
}, (req, res) => {
  // Successful authentication, redirect to dashboard
  console.log('Microsoft OAuth successful for user:', req.user ? req.user.email : 'unknown');
  res.redirect('/dashboard');
});

// Register route
router.post('/register', async (req, res) => {
  if (FORCE_DEV_MODE) {
    return res.status(501).json({ message: 'Registration not available in dev mode' });
  }

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
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

module.exports = router;
