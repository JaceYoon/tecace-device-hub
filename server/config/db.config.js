const isProduction = process.env.NODE_ENV === 'production';

// Use production or development values based on NODE_ENV
module.exports = {
  HOST: isProduction ? process.env.PROD_DB_HOST || '172.20.0.130' : process.env.DEV_DB_HOST || 'localhost',
  PORT: isProduction ? process.env.PROD_DB_PORT || 3306 : process.env.DEV_DB_PORT || 3306,
  USER: isProduction ? process.env.PROD_DB_USER || 'root' : process.env.DEV_DB_USER || 'root',
  PASSWORD: isProduction ? process.env.PROD_DB_PASSWORD || 'Tecace6070' : process.env.DEV_DB_PASSWORD || 'Tecace6070',
  DB: isProduction ? process.env.PROD_DB_NAME || 'tecace_devices' : process.env.DEV_DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Improved connection options for MariaDB
    connectTimeout: 120000, // Increased connection timeout to 2 minutes
    supportBigNumbers: true,
    bigNumberStrings: true,
    trace: false, // Always disable trace
    // Debug options - but don't log binary data
    debug: false, // Always disable debug
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ 
        password: isProduction 
          ? process.env.PROD_DB_PASSWORD || 'Tecace6070' 
          : process.env.DEV_DB_PASSWORD || 'Tecace6070' 
      })
    }
  },
  pool: {
    max: 10, // Increased max connections
    min: 0,
    acquire: 120000, // Increased acquire timeout to 2 minutes
    idle: 30000 // Increased idle timeout
  },
  logging: false, // Always disable logging
  retry: {
    match: [
      /ETIMEDOUT/,
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ESOCKETTIMEDOUT/,
      /PROTOCOL_CONNECTION_LOST/,
      /PROTOCOL_SEQUENCE_TIMEOUT/,
      /ER_LOCK_DEADLOCK/
    ],
    max: 5 // Maximum retry attempts
  }
};
