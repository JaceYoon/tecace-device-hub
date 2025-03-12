
// Authentication middleware

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized - Please log in' });
};

// Check if user is a manager
exports.isManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Requires manager role' });
};
