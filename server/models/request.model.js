
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
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    requestedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    processedAt: {
      type: Sequelize.DATE
    }
  });
  
  return Request;
};
