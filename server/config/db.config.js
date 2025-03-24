
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
    trace: process.env.DB_DEBUG === 'true', // Only enable trace when DB_DEBUG is true
    // Debug options - but don't log binary data
    debug: process.env.DB_DEBUG === 'true',
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
  logging: process.env.SQL_LOG === 'true' ? (sql) => {
    // Only log SQL statements, not binary protocol messages
    if (!sql.includes('Quit') && !sql.startsWith('--') && !sql.includes('+--') && !sql.match(/\|\s+\d\s+\d\s+\d/)) {
      console.log(sql);
    }
  } : false,
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
