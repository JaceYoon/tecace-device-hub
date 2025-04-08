
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('user', 'admin', 'manager'),
      defaultValue: 'user'
    },
    avatarUrl: {
      type: Sequelize.STRING
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  });
  
  // Ensure IDs are correctly converted when sending to client
  User.afterFind((users) => {
    if (!users) return users;
    
    if (Array.isArray(users)) {
      users.forEach(user => {
        if (user.id) {
          // Ensure ID is a string for frontend compatibility
          user.id = String(user.id);
        }
      });
    } else if (users.id) {
      users.id = String(users.id);
    }
    
    return users;
  });
  
  return User;
};
