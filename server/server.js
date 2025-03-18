
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const db = require('./models');
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'tecace-device-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport with local strategy
app.use(passport.initialize());
app.use(passport.session());

// Initialize passport config
require('./config/passport.config')();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Tecace Device Management API' });
});

// Check if the user wants to force development mode
const forceDevelopmentMode = process.env.FORCE_DEV_MODE === 'true';

if (forceDevelopmentMode) {
  console.log('Running in forced development mode without database connection');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // Database sync & server start
  console.log('Attempting to connect to the database...');
  db.sequelize.sync()
    .then(() => {
      console.log('Database synced successfully');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to sync database:', err);
      console.log('ERROR DETAILS:', err.message);
      console.log('If you want to run without a database connection, set FORCE_DEV_MODE=true in your .env file');
      // We'll still start the server so the application can function
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (without database sync)`);
      });
    });
}
