
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'password',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mariadb',
  dialectOptions: {
    // Adding specific options to handle the authentication issue
    connectTimeout: 10000, // Increase connection timeout
    usePassword: true, // Explicitly use password auth
    // Disable GSSAPI authentication that's causing the issue
    disableGSSAPI: true, 
    // Most common auth method that should work
    authPlugins: {
      mysql_native_password: () => ({ password: process.env.DB_PASSWORD || 'password' })
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
