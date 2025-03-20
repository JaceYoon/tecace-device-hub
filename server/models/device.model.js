
module.exports = (sequelize, Sequelize) => {
  const Device = sequelize.define('device', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project: {
      type: Sequelize.STRING,
      allowNull: false
    },
    projectGroup: {
      type: Sequelize.STRING,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    imei: {
      type: Sequelize.STRING,
      allowNull: true
    },
    serialNumber: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('available', 'assigned', 'missing', 'stolen'),
      defaultValue: 'available'
    },
    deviceStatus: {
      type: Sequelize.STRING,
      allowNull: true
    },
    receivedDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    returnDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT
    }
  });
  
  return Device;
};
