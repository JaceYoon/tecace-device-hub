
const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

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
const maxRetries = 5; // Increased from 3 to 5
let retryCount = 0;
let connectionEstablished = false;

// Create Sequelize instance with retry logic
const createSequelizeInstance = () => {
  console.log(`Attempting to connect to MariaDB (Attempt ${retryCount + 1}/${maxRetries})...`);
  
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
    dialectOptions: dbConfig.dialectOptions,
    retry: dbConfig.retry // Use retry configuration
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

// Updated function to test the database connection with enhanced retry and error reporting
const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully!');
    connectionEstablished = true;
    return true;
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err.message);
    
    // More detailed error logging
    if (err.original) {
      console.error('Original error:', {
        code: err.original.code,
        errno: err.original.errno,
        sqlState: err.original.sqlState,
        sqlMessage: err.original.sqlMessage
      });
    }
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`🔄 Retrying connection (${retryCount}/${maxRetries})...`);
      
      // Progressive backoff: wait longer between each retry
      const waitTime = 2000 * retryCount;
      console.log(`Waiting ${waitTime/1000} seconds before next attempt...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return testDatabaseConnection();
    } else {
      console.error('❌ Maximum connection retry attempts reached.');
      console.error('🔍 Database connection troubleshooting guide:');
      console.error('Connection details:', {
        host: dbConfig.HOST,
        port: dbConfig.PORT,
        user: dbConfig.USER,
        database: dbConfig.DB,
        dialect: dbConfig.dialect
      });
      
      console.error('📋 Common solutions:');
      console.error('1. Make sure MariaDB server is running (`systemctl status mariadb` or `mysql.server status`)');
      console.error('2. Check user credentials (try `mysql -u root -p` to test login)');
      console.error('3. Ensure the database exists (run: `CREATE DATABASE tecace_devices;` in MySQL client)');
      console.error('4. Verify port is correct (default is 3306)');
      console.error('5. Check for firewall issues (`sudo ufw status` or check Windows Firewall)');
      console.error('6. Try connecting with a GUI tool like MySQL Workbench to test connection');
      
      // Check if database exists and create it if it doesn't
      try {
        console.log('Attempting to connect to server without specifying a database...');
        const rootSequelize = new Sequelize('mysql', dbConfig.USER, dbConfig.PASSWORD, {
          host: dbConfig.HOST,
          port: dbConfig.PORT,
          dialect: dbConfig.dialect,
          dialectOptions: {
            connectTimeout: 30000
          }
        });
        
        await rootSequelize.authenticate();
        console.log('Connected to server! Checking if database exists...');
        
        const [results] = await rootSequelize.query(
          `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbConfig.DB}'`
        );
        
        if (Array.isArray(results) && results.length === 0) {
          console.log(`Database '${dbConfig.DB}' does not exist. Attempting to create it...`);
          await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.DB};`);
          console.log(`Database '${dbConfig.DB}' created successfully!`);
          console.log('Please restart the server to connect to the new database.');
          return true;
        } else {
          console.log(`Database '${dbConfig.DB}' exists but connection failed for other reasons.`);
        }
        
        await rootSequelize.close();
      } catch (rootErr) {
        console.error('Failed to connect to server for database check:', rootErr.message);
      }
      
      // Return false to indicate connection failure
      return false;
    }
  }
};

// Test the database connection
testDatabaseConnection().then(success => {
  if (success && !connectionEstablished) {
    console.log('Database connection verification completed, but connection was not fully established.');
    console.log('The server will start, but some database operations may fail.');
  }
});

module.exports = db;
