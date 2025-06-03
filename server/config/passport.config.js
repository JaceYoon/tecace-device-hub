
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcrypt');
const db = require('../models');
const User = db.user;

module.exports = () => {
  // Configure local strategy for authentication
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await User.findOne({ where: { email } });
          
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure Microsoft OAuth strategy
  passport.use(
    new MicrosoftStrategy(
      {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ['user.read']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Microsoft OAuth profile received:', profile);
          
          // Extract user information from Microsoft profile
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const name = profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`;
          
          if (!email) {
            return done(new Error('No email found in Microsoft profile'), null);
          }
          
          // Check if user already exists
          let user = await User.findOne({ where: { email } });
          
          if (user) {
            // User exists, update their information if needed
            console.log('Existing user found, logging in:', email);
            return done(null, user);
          } else {
            // Create new user
            console.log('Creating new user from Microsoft OAuth:', email);
            user = await User.create({
              name: name,
              email: email,
              password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
              role: 'user', // Default role
              avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
            
            console.log('New user created successfully:', user.id);
            return done(null, user);
          }
        } catch (error) {
          console.error('Microsoft OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
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
  });
};
