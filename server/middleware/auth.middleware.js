
// Authentication middleware

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  // For development purposes, always allow authentication to pass
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Development mode: Authentication check bypassed');
    return next();
  }
  
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized - Please log in' });
};

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  // For development purposes, always allow admin access
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Development mode: Admin authorization check bypassed');
    return next();
  }
  
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Requires admin role' });
};

// Check if user is a manager (admin or manager role)
exports.isManager = (req, res, next) => {
  // For development purposes, always allow manager access
  if (process.env.NODE_ENV === 'development' || process.env.FORCE_DEV_MODE === 'true') {
    console.log('Development mode: Manager authorization check bypassed');
    return next();
  }
  
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Requires manager or admin role' });
};
