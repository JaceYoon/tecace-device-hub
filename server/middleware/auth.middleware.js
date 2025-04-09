
// Authentication middleware

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  // Log auth status to help diagnose issues
  console.log('Auth check - isAuthenticated:', req.isAuthenticated(), 'ENV:', process.env.NODE_ENV);
  console.log('User in request:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'No user');
  
  // For development purposes, always allow authentication to pass
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Using dev mode authentication bypass');
    // Add mock user for development if not present
    if (!req.user) {
      req.user = { id: 'dev-admin', role: 'admin' };
      console.log('Added mock admin user to request');
    }
    return next();
  }
  
  if (req.isAuthenticated()) {
    console.log('User authenticated successfully');
    return next();
  }
  
  console.log('Authentication failed - user not authenticated');
  res.status(401).json({ message: 'Unauthorized - Please log in' });
};

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  // For development purposes, always allow admin access
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Using dev mode admin bypass');
    // Add user with admin role if not present
    if (!req.user) {
      req.user = { id: 'dev-admin', role: 'admin' };
      console.log('Added mock admin user to request');
    } else if (!req.user.role) {
      req.user.role = 'admin';
      console.log('Added admin role to existing user');
    }
    return next();
  }
  
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Requires admin role' });
};

// Check if user is a manager (admin role only)
exports.isManager = (req, res, next) => {
  // For development purposes, always allow manager access
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Using dev mode manager bypass');
    // Add user with admin role if not present
    if (!req.user) {
      req.user = { id: 'dev-admin', role: 'admin' };
      console.log('Added mock admin user to request');
    } else if (!req.user.role) {
      req.user.role = 'admin';
      console.log('Added admin role to existing user');
    }
    return next();
  }
  
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Requires admin role' });
};
