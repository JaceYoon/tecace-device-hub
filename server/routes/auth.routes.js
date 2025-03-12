
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initialize passport config
require('../config/passport.config')();

// Login route - redirects to Atlassian login
router.get('/login', passport.authenticate('atlassian'));

// Atlassian callback
router.get('/atlassian/callback', 
  passport.authenticate('atlassian', { 
    failureRedirect: '/login-failed' 
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173/dashboard');
  }
);

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
