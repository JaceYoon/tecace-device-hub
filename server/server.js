
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

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080', // Changed to match Vite's current port in your environment
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  }
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Tecace Device Management API' });
});

// Database sync & server start
console.log('Connecting to the database...');

// Use force:true to drop existing tables and create new ones
db.sequelize.sync({ force: true })
  .then(async () => {
    console.log('Database synced successfully with force:true - tables were recreated');

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
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    console.log('ERROR DETAILS:', err.message);
  });
