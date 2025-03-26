
module.exports = (sequelize, Sequelize) => {
  const Request = sequelize.define('request', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: Sequelize.ENUM('assign', 'release'),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    requestedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    processedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Reason for request or release'
    }
  });
  
  return Request;
};
