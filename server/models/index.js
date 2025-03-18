
const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');

let sequelize;

// Create sequelize instance
if (process.env.NODE_ENV === 'development') {
  console.log('Using mock models in development mode');
  sequelize = { define: () => ({}) };
} else {
  sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    }
  });
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// In development mode, provide mock implementations
if (process.env.NODE_ENV === 'development') {
  // Mock models with basic CRUD operations
  const mockModel = {
    findAll: () => Promise.resolve([]),
    findByPk: () => Promise.resolve({}),
    create: (data) => Promise.resolve(data),
    update: () => Promise.resolve([1]),
    destroy: () => Promise.resolve(1),
    findOne: () => Promise.resolve({}),
    belongsTo: () => {},
    hasMany: () => {}
  };
  
  db.user = mockModel;
  db.device = mockModel;
  db.request = mockModel;
} else {
  // Load real models for production
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
}

module.exports = db;
