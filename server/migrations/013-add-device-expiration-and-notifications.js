const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 013: ADDING DEVICE EXPIRATION AND NOTIFICATION SYSTEM ===');
    
    try {
      // 1. Add expiration and rental period columns to devices table
      console.log('Adding expiration_date and rental_period_days columns to devices table...');
      
      await queryInterface.addColumn('devices', 'expiration_date', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the device assignment expires'
      });
      
      await queryInterface.addColumn('devices', 'rental_period_days', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 90,
        comment: 'Number of days for the rental period'
      });
      
      console.log('✅ Added expiration columns to devices table');
      
      // 2. Update existing assigned devices with 90-day expiration from today
      console.log('Setting expiration dates for existing assigned devices...');
      
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + 90);
      
      await queryInterface.sequelize.query(`
        UPDATE devices 
        SET expiration_date = ?, rental_period_days = 90 
        WHERE status = 'assigned' AND assignedToId IS NOT NULL
      `, {
        replacements: [expirationDate],
        type: QueryTypes.UPDATE
      });
      
      console.log('✅ Updated existing assigned devices with 90-day expiration');
      
      // 3. Create notification_settings table
      console.log('Creating notification_settings table...');
      
      await queryInterface.createTable('notification_settings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        threshold_days: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Days before expiration to send notification (e.g., 30, 15, 7)'
        },
        email_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether email notifications are enabled for this threshold'
        },
        web_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether web notifications are enabled for this threshold'
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
      
      console.log('✅ Created notification_settings table');
      
      // 4. Insert default notification thresholds
      console.log('Inserting default notification thresholds...');
      
      await queryInterface.bulkInsert('notification_settings', [
        {
          threshold_days: 30,
          email_enabled: true,
          web_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          threshold_days: 15,
          email_enabled: true,
          web_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          threshold_days: 7,
          email_enabled: true,
          web_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      
      console.log('✅ Inserted default notification thresholds (30, 15, 7 days)');
      
      // 5. Create device_notifications table
      console.log('Creating device_notifications table...');
      
      await queryInterface.createTable('device_notifications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        device_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        threshold_days: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Which threshold this notification was sent for'
        },
        notification_type: {
          type: Sequelize.ENUM('email', 'web'),
          allowNull: false,
          comment: 'Type of notification sent'
        },
        sent_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: 'When the notification was sent'
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
      
      // 6. Create web_notifications table
      console.log('Creating web_notifications table...');
      
      await queryInterface.createTable('web_notifications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        device_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'devices',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Notification title'
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Notification message content'
        },
        type: {
          type: Sequelize.ENUM('expiration_warning', 'assignment', 'return_reminder'),
          allowNull: false,
          comment: 'Type of notification'
        },
        read_status: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the user has read the notification'
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
      
      // 7. Create indexes for better performance
      console.log('Creating indexes for performance...');
      
      await queryInterface.addIndex('devices', ['expiration_date'], {
        name: 'idx_devices_expiration_date'
      });
      
      await queryInterface.addIndex('device_notifications', ['device_id', 'threshold_days'], {
        name: 'idx_device_notifications_device_threshold'
      });
      
      await queryInterface.addIndex('web_notifications', ['user_id', 'read_status'], {
        name: 'idx_web_notifications_user_read'
      });
      
      console.log('✅ Created performance indexes');
      
      console.log('=== MIGRATION 013 COMPLETED SUCCESSFULLY ===');
      console.log('Summary:');
      console.log('- Added expiration_date and rental_period_days to devices table');
      console.log('- Set 90-day expiration for existing assigned devices');
      console.log('- Created notification_settings table with default thresholds (30, 15, 7 days)');
      console.log('- Created device_notifications table for tracking sent notifications');
      console.log('- Created web_notifications table for in-app notifications');
      console.log('- Added performance indexes');
      
    } catch (error) {
      console.error('❌ MIGRATION 013 FAILED:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 013 ===');
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('devices', 'idx_devices_expiration_date');
      await queryInterface.removeIndex('device_notifications', 'idx_device_notifications_device_threshold');
      await queryInterface.removeIndex('web_notifications', 'idx_web_notifications_user_read');
      
      // Drop tables in reverse order
      await queryInterface.dropTable('web_notifications');
      await queryInterface.dropTable('device_notifications');
      await queryInterface.dropTable('notification_settings');
      
      // Remove columns from devices table
      await queryInterface.removeColumn('devices', 'rental_period_days');
      await queryInterface.removeColumn('devices', 'expiration_date');
      
      console.log('✅ MIGRATION 013 ROLLBACK COMPLETED');
      
    } catch (error) {
      console.error('❌ MIGRATION 013 ROLLBACK FAILED:', error);
      throw error;
    }
  }
};