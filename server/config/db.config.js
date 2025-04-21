
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
    trace: false,
    debug: false,
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' })
    }
  },
  pool: {
    max: 10, // Increased max connections
    min: 0,
    acquire: 120000, // Increased acquire timeout to 2 minutes
    idle: 30000 // Increased idle timeout
  },
  logging: false,
  retry: {
    match: [
      /ETIMEDOUT/,
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ESOCKETTIMEDOUT/,
      /PROTOCOL_CONNECTION_LOST/,
      /PROTOCOL_SEQUENCE_TIMEOUT/,
      /ER_LOCK_DEADLOCK/,
      /ER_LOCK_WAIT_TIMEOUT/ // Added lock wait timeout to retry list
    ],
    max: 5 // Maximum retry attempts
  },
  // Additional settings to help with lock timeouts
  transactionOptions: {
    isolationLevel: 'READ COMMITTED',
    timeout: 30000 // 30 second timeout for transactions
  }
};
