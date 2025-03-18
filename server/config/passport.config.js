
const passport = require('passport');
const db = require('../models');
const User = db.user;

module.exports = () => {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    // Check if we're in forced development mode
    if (process.env.FORCE_DEV_MODE === 'true') {
      // Use mock users for development
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
    } else {
      // In production, fetch user from database
      try {
        const user = await User.findByPk(id);
        if (user) {
          done(null, user);
        } else {
          done(new Error('User not found'), null);
        }
      } catch (error) {
        done(error, null);
      }
    }
  });
};
