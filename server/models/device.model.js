
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
      type: Sequelize.ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'Accessory', 'Other'),
      allowNull: false
    },
    deviceType: {
      type: Sequelize.ENUM('C-Type', 'Lunchbox'),
      allowNull: false,
      defaultValue: 'C-Type'
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
      type: Sequelize.TEXT,
      allowNull: true
    },
    devicePicture: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      comment: 'Base64 encoded image of the device'
    },
    addedById: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedToId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    requestedBy: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });
  
  return Device;
};
