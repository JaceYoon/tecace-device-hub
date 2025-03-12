
const passport = require('passport');
const AtlassianStrategy = require('passport-atlassian-oauth2').Strategy;
const db = require('../models');
const User = db.user;

module.exports = () => {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  
  // Atlassian OAuth2 strategy
  passport.use(new AtlassianStrategy({
    clientID: process.env.ATLASSIAN_CLIENT_ID,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
    callbackURL: process.env.ATLASSIAN_CALLBACK_URL,
    scope: ['read:me', 'read:confluence-user'],
    audience: 'api.atlassian.com',
    baseURL: process.env.ATLASSIAN_BASE_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ where: { atlassianId: profile.id } });
      
      if (!user) {
        user = await User.create({
          atlassianId: profile.id,
          name: profile.displayName,
          email: profile.email,
          avatarUrl: profile._json.picture,
          role: 'user', // Default role
          refreshToken: refreshToken
        });
      } else {
        // Update user info if needed
        await user.update({
          name: profile.displayName,
          email: profile.email,
          avatarUrl: profile._json.picture,
          refreshToken: refreshToken
        });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
};
