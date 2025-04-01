
module.exports = (sequelize, Sequelize) => {
  const Request = sequelize.define('request', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: Sequelize.ENUM('assign', 'release', 'report'),
      allowNull: false
    },
    reportType: {
      type: Sequelize.ENUM('missing', 'stolen', 'dead'),
      allowNull: true,
      comment: 'Type of report for device issues'
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled', 'returned'),
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
      comment: 'Reason for request, release or report'
    }
  });
  
  return Request;
};
