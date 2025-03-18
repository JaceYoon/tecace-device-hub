
module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'password',
  DB: process.env.DB_NAME || 'tecace_devices',
  dialect: 'mysql', // Changed from mariadb to mysql
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
