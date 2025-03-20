
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'Tecace6070',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Improved connection options for MariaDB
    connectTimeout: 60000, // Increase connection timeout
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Debug options - enable for development
    debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true',
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' }),
      mysql_clear_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' }),
      caching_sha2_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' })
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000, // Increase acquire timeout to 60 seconds
    idle: 10000
  }
};
