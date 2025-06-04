
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcrypt');

// Check if we're in force dev mode
const FORCE_DEV_MODE = process.env.FORCE_DEV_MODE === 'true';

// Only require db models if not in dev mode
let User = null;
if (!FORCE_DEV_MODE) {
  const db = require('../models');
  User = db.user;
}

module.exports = () => {
  // Configure local strategy for authentication - only if not in dev mode
  if (!FORCE_DEV_MODE) {
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
  }

  // Debug Microsoft OAuth environment variables
  console.log('Microsoft OAuth Configuration:');
  console.log('MICROSOFT_CLIENT_ID:', process.env.MICROSOFT_CLIENT_ID ? 'Set' : 'Not set');
  console.log('MICROSOFT_CLIENT_SECRET:', process.env.MICROSOFT_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('MICROSOFT_CALLBACK_URL:', process.env.MICROSOFT_CALLBACK_URL);

  // Log the actual values for debugging (remove in production)
  console.log('Actual MICROSOFT_CLIENT_ID:', process.env.MICROSOFT_CLIENT_ID);
  console.log('Actual MICROSOFT_CLIENT_SECRET:', process.env.MICROSOFT_CLIENT_SECRET ? '***HIDDEN***' : 'NOT SET');

  // Only configure Microsoft OAuth if credentials are provided
  if (process.env.MICROSOFT_CLIENT_ID) {
    console.log('Configuring Microsoft OAuth strategy...');
    
    try {
      // Configure Microsoft OAuth strategy for public client (without client secret)
      const strategyConfig = {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:5000/auth/microsoft/callback',
        // Use tenant-specific endpoint for single-tenant apps
        tenant: 'organizations',
        authorizationURL: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
        tokenURL: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
        scope: ['user.read']
      };

      // Only add client secret if it exists (for confidential clients)
      if (process.env.MICROSOFT_CLIENT_SECRET) {
        strategyConfig.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        console.log('Using confidential client flow with client secret');
      } else {
        console.log('Using public client flow without client secret');
      }

      passport.use(
        new MicrosoftStrategy(
          strategyConfig,
          async (accessToken, refreshToken, profile, done) => {
            try {
              console.log('Microsoft OAuth profile received:', profile);
              
              // Extract user information from Microsoft profile
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
              const name = profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`;
              
              if (!email) {
                return done(new Error('No email found in Microsoft profile'), null);
              }
              
              if (FORCE_DEV_MODE) {
                // In dev mode, just create a mock user for the session
                console.log('DEV MODE: Creating mock user from Microsoft OAuth:', email);
                const mockUser = {
                  id: 'microsoft_' + Date.now(),
                  name: name,
                  email: email,
                  role: 'user',
                  avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                };
                return done(null, mockUser);
              }
              
              // Database mode - check if user already exists
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
      
      console.log('Microsoft OAuth strategy configured successfully');
    } catch (error) {
      console.error('Error configuring Microsoft OAuth strategy:', error);
      console.error('This might be due to invalid credentials or configuration');
    }
  } else {
    console.warn('Microsoft OAuth credentials not found. Microsoft authentication will be disabled.');
    console.warn('Please set MICROSOFT_CLIENT_ID in your .env file');
  }

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      if (FORCE_DEV_MODE) {
        // In dev mode, create a mock user
        const mockUser = {
          id: id,
          name: 'Dev User',
          email: 'dev@tecace.com',
          role: 'admin',
          avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=dev'
        };
        done(null, mockUser);
        return;
      }
      
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
