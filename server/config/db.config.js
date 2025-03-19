
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'Tecace6070',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Improved connection options for MariaDB
    connectTimeout: 60000, // Increase connection timeout even more
    trace: true, // Enable tracing for detailed errors
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Debug options
    debug: true,
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'password' }),
      mysql_clear_password: () => ({ password: process.env.DB_PASSWORD || 'password' }),
      caching_sha2_password: () => ({ password: process.env.DB_PASSWORD || 'password' })
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
