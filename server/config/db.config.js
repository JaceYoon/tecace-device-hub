
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'Tecace6070',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Improved connection options for MariaDB
    connectTimeout: 30000, // Reduced connection timeout
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Debug options - but don't log binary data
    debug: false,
    // Try to handle various authentication methods
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'Tecace6070' })
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000, // Reduce acquire timeout to 30 seconds
    idle: 10000
  },
  logging: process.env.SQL_LOG === 'true' ? (sql) => {
    // Only log SQL statements, not binary protocol messages
    if (!sql.includes('Quit') && !sql.startsWith('--') && !sql.includes('+--') && !sql.match(/\|\s+\d\s+\d\s+\d/)) {
      console.log(sql);
    }
  } : false
};
