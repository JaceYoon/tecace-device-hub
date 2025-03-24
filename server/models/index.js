
const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');

// Create sequelize instance
console.log('Connecting to database with config:', {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  database: dbConfig.DB,
  user: dbConfig.USER,
  dialect: dbConfig.dialect
});

// Configure logging function to be more selective
const loggingFunction = process.env.NODE_ENV === 'development' && process.env.SQL_LOG === 'true' 
  ? console.log 
  : false;

// Add error retry logic
const maxRetries = 3;
let retryCount = 0;

// Create Sequelize instance with retry logic
const createSequelizeInstance = () => {
  return new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,
    logging: loggingFunction, // Controlled SQL logging
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    dialectOptions: dbConfig.dialectOptions
  });
};

// Initial instance creation
const sequelize = createSequelizeInstance();

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.user = require('./user.model')(sequelize, Sequelize);
db.device = require('./device.model')(sequelize, Sequelize);
db.request = require('./request.model')(sequelize, Sequelize);

// Relationships
db.user.hasMany(db.device, { foreignKey: 'assignedToId', as: 'assignedDevices' });
db.user.hasMany(db.device, { foreignKey: 'addedById', as: 'addedDevices' });
db.device.belongsTo(db.user, { foreignKey: 'assignedToId', as: 'assignedTo' });
db.device.belongsTo(db.user, { foreignKey: 'addedById', as: 'addedBy' });

db.user.hasMany(db.request, { foreignKey: 'userId' });
db.user.hasMany(db.request, { foreignKey: 'processedById' });
db.device.hasMany(db.request, { foreignKey: 'deviceId' });
db.request.belongsTo(db.user, { foreignKey: 'userId' });
db.request.belongsTo(db.user, { foreignKey: 'processedById', as: 'processedBy' });
db.request.belongsTo(db.device, { foreignKey: 'deviceId' });

// Function to test the database connection with retry
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (err) {
    console.error('Unable to connect to the database:', err.message);
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return testDatabaseConnection();
    } else {
      console.error('Maximum connection retry attempts reached.');
      console.error('Please verify your MariaDB installation is running and credentials are correct:');
      console.error('Connection details:', {
        host: dbConfig.HOST,
        port: dbConfig.PORT,
        user: dbConfig.USER,
        database: dbConfig.DB,
        dialect: dbConfig.dialect
      });
      console.error('Common fixes:');
      console.error('1. Make sure MariaDB server is running');
      console.error('2. Check that the user and password are correct');
      console.error('3. Ensure the database exists (run: CREATE DATABASE tecace_devices;)');
      console.error('4. Verify the port is correct (default is 3306)');
      console.error('5. Check firewall settings if connecting to a remote database');
      
      // Return false to indicate connection failure
      return false;
    }
  }
};

// Test the database connection
testDatabaseConnection();

module.exports = db;
