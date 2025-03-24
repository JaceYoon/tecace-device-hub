
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
    processedAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });
  
  return Request;
};
