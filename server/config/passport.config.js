
const passport = require('passport');

module.exports = () => {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser((id, done) => {
    // In a real application, you would fetch user from database
    // For demo purposes, we'll create mock users
    if (id === 'admin-1') {
      done(null, {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@tecace.com',
        role: 'admin'
      });
    } else if (id === 'user-1') {
      done(null, {
        id: 'user-1',
        name: 'Demo User',
        email: 'demo@tecace.com',
        role: 'user'
      });
    } else {
      done(new Error('User not found'), null);
    }
  });
};
