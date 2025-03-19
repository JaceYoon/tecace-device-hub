
const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');

// Create sequelize instance
console.log('Connecting to database with config:', {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  database: dbConfig.DB,
  user: dbConfig.USER,
  dialect: dbConfig.dialect
});

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,
  logging: console.log, // Enable SQL logging
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.user = require('./user.model')(sequelize, Sequelize);
db.device = require('./device.model')(sequelize, Sequelize);
db.request = require('./request.model')(sequelize, Sequelize);

// Relationships
db.user.hasMany(db.device, { foreignKey: 'assignedToId', as: 'assignedDevices' });
db.user.hasMany(db.device, { foreignKey: 'addedById', as: 'addedDevices' });
db.device.belongsTo(db.user, { foreignKey: 'assignedToId', as: 'assignedTo' });
db.device.belongsTo(db.user, { foreignKey: 'addedById', as: 'addedBy' });

db.user.hasMany(db.request, { foreignKey: 'userId' });
db.user.hasMany(db.request, { foreignKey: 'processedById' });
db.device.hasMany(db.request, { foreignKey: 'deviceId' });
db.request.belongsTo(db.user, { foreignKey: 'userId' });
db.request.belongsTo(db.user, { foreignKey: 'processedById', as: 'processedBy' });
db.request.belongsTo(db.device, { foreignKey: 'deviceId' });

// Test the database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = db;
