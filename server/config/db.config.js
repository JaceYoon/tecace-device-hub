
// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'Tecace6070',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Improved connection options for MariaDB
    connectTimeout: 120000, // Increased connection timeout to 2 minutes
    supportBigNumbers: true,
    bigNumberStrings: true,
    trace: false, // Always disable trace
    // Debug options - but don't log binary data
    debug: isProduction ? false : (process.env.DB_DEBUG === 'true'),
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' })
    },
    // Production SSL configuration if needed
    ssl: isProduction && process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : undefined
  },
  pool: {
    max: isProduction ? 20 : 10, // Increased max connections for production
    min: 0,
    acquire: 120000, // Increased acquire timeout to 2 minutes
    idle: 30000 // Increased idle timeout
  },
  logging: isProduction ? false : (process.env.SQL_LOG === 'true'),
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
