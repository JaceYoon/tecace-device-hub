
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    atlassianId: {
      type: Sequelize.STRING,
      unique: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: Sequelize.ENUM('user', 'manager'),
      defaultValue: 'user'
    },
    avatarUrl: {
      type: Sequelize.STRING
    },
    refreshToken: {
      type: Sequelize.TEXT
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  });
  
  return User;
};
