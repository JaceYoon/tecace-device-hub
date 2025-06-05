
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
      type: Sequelize.ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other']],
          msg: 'Device type must be one of: Smartphone, Tablet, Smartwatch, Box, PC, Accessory, Other'
        }
      }
    },
    deviceType: {
      type: Sequelize.ENUM('C-Type', 'Lunchbox'),
      allowNull: false,
      defaultValue: 'C-Type',
      validate: {
        isIn: {
          args: [['C-Type', 'Lunchbox']],
          msg: 'Device type must be either C-Type or Lunchbox'
        }
      }
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
      type: Sequelize.ENUM('available', 'assigned', 'missing', 'stolen', 'returned', 'dead', 'pending'),
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
    memo: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Memo field for additional device information'
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
