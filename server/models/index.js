
const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

// Configure Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  logging: console.log, // Enable detailed SQL logging
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
db.user = require("./user.model.js")(sequelize, Sequelize);
db.device = require("./device.model.js")(sequelize, Sequelize);
db.request = require("./request.model.js")(sequelize, Sequelize);

// Define relationships

// User - Device relationships
db.user.hasMany(db.device, { as: "addedDevices", foreignKey: "addedById" });
db.device.belongsTo(db.user, { as: "addedBy", foreignKey: "addedById" });

db.user.hasMany(db.device, { as: "assignedDevices", foreignKey: "assignedToId" });
db.device.belongsTo(db.user, { as: "assignedTo", foreignKey: "assignedToId" });

// Request relationships
db.device.hasMany(db.request, { as: "requests", foreignKey: "deviceId" });
db.request.belongsTo(db.device, { as: "device", foreignKey: "deviceId" });

db.user.hasMany(db.request, { as: "requests", foreignKey: "userId" });
db.request.belongsTo(db.user, { as: "user", foreignKey: "userId" });

db.user.hasMany(db.request, { as: "processedRequests", foreignKey: "processedById" });
db.request.belongsTo(db.user, { as: "processedBy", foreignKey: "processedById" });

module.exports = db;
