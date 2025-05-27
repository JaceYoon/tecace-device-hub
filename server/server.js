
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('./models');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://dm.tecace.com/api'
  : `http://localhost:${PORT}/api`;
const CLIENT_URL = process.env.NODE_ENV === 'production'
  ? 'https://dm.tecace.com'
  : 'http://localhost:8080';

// Print environment for debugging
console.log('Environment settings:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLIENT_URL:', CLIENT_URL);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('FORCE_DEV_MODE:', process.env.FORCE_DEV_MODE);
console.log('RESET_DATABASE:', process.env.RESET_DATABASE);
console.log('Server will run on port:', PORT);

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

console.log('CORS configured with origin:', corsOptions.origin);

// Middleware
app.use(cors(corsOptions));

// Increase payload size limits for all routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Database configuration for session store
const dbConfig = require('./config/db.config');
const sessionStore = new MySQLStore({
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  // The session table name
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  },
  createDatabaseTable: true, // Auto-create the sessions table
  clearExpired: true, // Automatically clear expired sessions
  checkExpirationInterval: 900000, // Check for expired sessions every 15 minutes
  expiration: 86400000, // Sessions expire after 24 hours
});

// Session setup with MySQL session store
app.use(session({
  key: 'tecace_session',
  secret: process.env.SESSION_SECRET || 'tecace-device-secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize passport config
require('./config/passport.config')();

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Tecace Device Management API' });
});

// Add error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Function to run migrations
const runMigrations = async () => {
  try {
    console.log('=== RUNNING MIGRATIONS ===');
    const { Umzug, SequelizeStorage } = require('umzug');
    const path = require('path');
    
    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, 'migrations/*.js'),
      },
      context: db.sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: db.sequelize }),
      logger: console,
    });

    // Check pending migrations
    const pending = await umzug.pending();
    console.log('Pending migrations:', pending.map(m => m.name));

    if (pending.length > 0) {
      console.log('Running pending migrations...');
      await umzug.up();
      console.log('✅ All migrations completed successfully');
    } else {
      console.log('✅ No pending migrations');
    }

    // Check current database state
    const [results] = await db.sequelize.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
    );
    
    const currentEnum = results[0]?.COLUMN_TYPE || '';
    console.log('Current device type ENUM after migrations:', currentEnum);
    
    if (currentEnum.includes("'PC'")) {
      console.log('✅ PC is available in device type ENUM');
    } else {
      console.log('❌ PC is NOT available in device type ENUM');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Database sync & server start
console.log('Connecting to the database...');

// Determine whether to force sync based on RESET_DATABASE environment variable
const shouldForceSync = process.env.RESET_DATABASE === 'true';
console.log('Force sync database:', shouldForceSync);

// Use force:true to drop existing tables and create new ones if RESET_DATABASE is true
db.sequelize.sync({ force: shouldForceSync })
  .then(async () => {
    console.log(`Database synced successfully${shouldForceSync ? ' with force:true - tables were recreated' : ''}`);

    // Run migrations after sync
    if (!shouldForceSync) {
      await runMigrations();
    }

    // Check if admin account exists, create one if it doesn't
    try {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.user.create({
          name: 'Administrator',
          email: 'admin@tecace.com',
          password: hashedPassword,
          role: 'admin',
          avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=admin',
          active: true
        });
        console.log('Default admin account created: admin@tecace.com / admin123');
      } else {
        console.log('Admin account already exists, no need to create');
      }
    } catch (error) {
      console.error('Error checking/creating admin account:', error);
      console.log('ERROR DETAILS:', error.message);
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ API is available at ${API_BASE_URL}`);
      console.log(`✅ Client URL: ${CLIENT_URL}`);
      console.log('🔑 Default admin credentials: admin@tecace.com / admin123');
    });
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
    console.log('ERROR DETAILS:', err.message);

    // Start server anyway to allow health check endpoint
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on port ${PORT} but database sync failed!`);
      console.log(`⚠️ Limited functionality may be available at http://localhost:${PORT}/api`);
      console.log('Please fix database connection issues and restart the server.');
    });
  });
