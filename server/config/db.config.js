
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'Tecace6070',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    connectTimeout: 120000,
    supportBigNumbers: true,
    bigNumberStrings: true,
    trace: false,
    debug: false,
    // Remove problematic auth plugins for compatibility
    timezone: '+00:00'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 120000,
    idle: 30000
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
      /ER_LOCK_WAIT_TIMEOUT/
    ],
    max: 5
  }
};
