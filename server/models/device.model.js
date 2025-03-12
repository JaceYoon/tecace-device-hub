
module.exports = (sequelize, Sequelize) => {
  const Device = sequelize.define('device', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    imei: {
      type: Sequelize.STRING,
      unique: true
    },
    serialNumber: {
      type: Sequelize.STRING,
      unique: true
    },
    status: {
      type: Sequelize.ENUM('available', 'assigned', 'missing', 'stolen'),
      defaultValue: 'available'
    },
    notes: {
      type: Sequelize.TEXT
    }
  });
  
  return Device;
};
