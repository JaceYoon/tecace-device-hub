const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration 020: Fixing web_notifications schema...');
    
    try {
      // Check if web_notifications table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('web_notifications')) {
        console.log('Creating web_notifications table...');
        await queryInterface.createTable('web_notifications', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          title: {
            type: DataTypes.STRING(255),
            allowNull: false
          },
          message: {
            type: DataTypes.TEXT,
            allowNull: false
          },
          type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'info'
          },
          is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        });
      } else {
        console.log('web_notifications table exists, checking columns...');
        
        // Get table description
        const tableDescription = await queryInterface.describeTable('web_notifications');
        
        // Fix type column size if needed
        if (tableDescription.type && tableDescription.type.type.includes('VARCHAR(')) {
          console.log('Updating type column size...');
          await queryInterface.changeColumn('web_notifications', 'type', {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'info'
          });
        }
        
        // Handle read_status vs is_read column
        if (tableDescription.read_status && !tableDescription.is_read) {
          console.log('Renaming read_status to is_read...');
          await queryInterface.renameColumn('web_notifications', 'read_status', 'is_read');
        } else if (!tableDescription.is_read && !tableDescription.read_status) {
          console.log('Adding is_read column...');
          await queryInterface.addColumn('web_notifications', 'is_read', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          });
        }
        
        // Ensure title column exists and has proper size
        if (!tableDescription.title) {
          console.log('Adding title column...');
          await queryInterface.addColumn('web_notifications', 'title', {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'Notification'
          });
        }
      }
      
      console.log('Migration 020: Successfully fixed web_notifications schema');
      
    } catch (error) {
      console.error('Migration 020 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration 020: Rolling back web_notifications schema changes...');
    
    try {
      // Rename is_read back to read_status
      const tableDescription = await queryInterface.describeTable('web_notifications');
      
      if (tableDescription.is_read) {
        await queryInterface.renameColumn('web_notifications', 'is_read', 'read_status');
      }
      
      // Revert type column to smaller size (if needed)
      await queryInterface.changeColumn('web_notifications', 'type', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'info'
      });
      
      console.log('Migration 020: Successfully rolled back web_notifications schema changes');
      
    } catch (error) {
      console.error('Migration 020 rollback failed:', error);
      throw error;
    }
  }
};