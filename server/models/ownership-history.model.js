
module.exports = (sequelize, Sequelize) => {
  const OwnershipHistory = sequelize.define('ownershipHistory', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deviceId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    releasedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    releasedById: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    releaseReason: {
      type: Sequelize.STRING,
      allowNull: true
    }
  });
  
  return OwnershipHistory;
};
