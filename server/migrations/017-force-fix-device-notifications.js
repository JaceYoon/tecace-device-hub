const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 017: FORCE FIX DEVICE NOTIFICATIONS ===');
    
    try {
      // Drop and recreate device_notifications table to ensure clean state
      console.log('Dropping and recreating device_notifications table...');
      
      try {
        await queryInterface.dropTable('device_notifications');
        console.log('✅ Dropped existing device_notifications table');
      } catch (error) {
        console.log('ℹ️ device_notifications table did not exist or could not be dropped:', error.message);
      }

      // Create device_notifications table with all required columns
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
      console.log('✅ Created device_notifications table with all required columns');

      // Also ensure web_notifications table exists
      const tables = await queryInterface.showAllTables();
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
      } else {
        console.log('✅ web_notifications table already exists');
      }

      // Verify the table structure
      const columns = await queryInterface.describeTable('device_notifications');
      console.log('Final device_notifications table columns:', Object.keys(columns));
      
      if (!columns.type) {
        throw new Error('type column was not created properly!');
      }
      if (!columns.is_read) {
        throw new Error('is_read column was not created properly!');
      }
      if (!columns.message) {
        throw new Error('message column was not created properly!');
      }

      console.log('=== MIGRATION 017 COMPLETED SUCCESSFULLY ===');
      
    } catch (error) {
      console.error('❌ MIGRATION 017 FAILED:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 017 ===');
    
    try {
      await queryInterface.dropTable('device_notifications');
      console.log('✅ Dropped device_notifications table');
      
      await queryInterface.dropTable('web_notifications');
      console.log('✅ Dropped web_notifications table');
      
      console.log('✅ MIGRATION 017 ROLLBACK COMPLETED');
      
    } catch (error) {
      console.error('❌ MIGRATION 017 ROLLBACK FAILED:', error);
      throw error;
    }
  }
};