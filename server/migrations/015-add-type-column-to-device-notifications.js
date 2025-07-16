const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 015: CREATING NOTIFICATION TABLES ===');
    
    try {
      // Check if device_notifications table exists
      const tables = await queryInterface.showAllTables();
      
      // Create device_notifications table if it doesn't exist
      if (!tables.includes('device_notifications')) {
        console.log('Creating device_notifications table...');
        await queryInterface.createTable('device_notifications', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          device_id: {
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Device ID reference'
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'User ID reference'
          },
          type: {
            type: Sequelize.ENUM('expiring_soon', 'overdue', 'returned', 'return_request'),
            allowNull: false,
            defaultValue: 'expiring_soon',
            comment: 'Type of device notification'
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Notification message content'
          },
          sent_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
            comment: 'When notification was sent'
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the notification has been read'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        });
        console.log('✅ Created device_notifications table');
      } else {

        // Check if columns exist and add missing ones
        const columns = await queryInterface.describeTable('device_notifications');
        
        if (!columns.type) {
          console.log('Adding type column to device_notifications table...');
          await queryInterface.addColumn('device_notifications', 'type', {
            type: Sequelize.ENUM('expiring_soon', 'overdue', 'returned', 'return_request'),
            allowNull: false,
            defaultValue: 'expiring_soon',
            comment: 'Type of device notification'
          });
          console.log('✅ Added type column to device_notifications table');
        }

        if (!columns.is_read) {
          console.log('Adding is_read column to device_notifications table...');
          await queryInterface.addColumn('device_notifications', 'is_read', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the notification has been read'
          });
          console.log('✅ Added is_read column to device_notifications table');
        }

        if (!columns.message) {
          console.log('Adding message column to device_notifications table...');
          await queryInterface.addColumn('device_notifications', 'message', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Notification message content'
          });
          console.log('✅ Added message column to device_notifications table');
        }
      }

      // Create web_notifications table if it doesn't exist
      if (!tables.includes('web_notifications')) {
        console.log('Creating web_notifications table...');
        await queryInterface.createTable('web_notifications', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'User ID reference'
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Notification title'
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Notification message content'
          },
          type: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'info',
            comment: 'Type of web notification'
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the notification has been read'
          },
          action_url: {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Optional URL for notification action'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        });
        console.log('✅ Created web_notifications table');
      }

      console.log('=== MIGRATION 015 COMPLETED SUCCESSFULLY ===');
      
    } catch (error) {
      console.error('❌ MIGRATION 015 FAILED:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 015 ===');
    
    try {
      // Check if device_notifications table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('device_notifications')) {
        console.log('⚠️ device_notifications table does not exist, nothing to rollback');
        return;
      }

      // Drop device_notifications table if it exists
      if (tables.includes('device_notifications')) {
        await queryInterface.dropTable('device_notifications');
        console.log('✅ Dropped device_notifications table');
      }

      // Drop web_notifications table if it exists
      if (tables.includes('web_notifications')) {
        await queryInterface.dropTable('web_notifications');
        console.log('✅ Dropped web_notifications table');
      }
      
      console.log('✅ MIGRATION 015 ROLLBACK COMPLETED');
      
    } catch (error) {
      console.error('❌ MIGRATION 015 ROLLBACK FAILED:', error);
      throw error;
    }
  }
};