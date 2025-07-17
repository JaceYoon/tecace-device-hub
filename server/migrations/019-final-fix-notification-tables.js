const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('[SERVER] === MIGRATION 019: FINAL FIX NOTIFICATION TABLES ===');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check what tables currently exist using showAllTables (avoids MariaDB meta property issue)
      const existingTables = await queryInterface.showAllTables({ transaction });
      console.log('[SERVER] Existing tables:', existingTables);
      
      // 1. Fix device_notifications table
      if (existingTables.includes('device_notifications')) {
        console.log('[SERVER] Dropping existing device_notifications table...');
        await queryInterface.dropTable('device_notifications', { transaction });
      }
      
      console.log('[SERVER] Creating device_notifications table with correct schema...');
      await queryInterface.createTable('device_notifications', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        device_id: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Device ID reference'
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'User ID reference'
        },
        type: {
          type: DataTypes.ENUM('expiring_soon', 'overdue', 'returned', 'return_request'),
          allowNull: false,
          defaultValue: 'expiring_soon',
          comment: 'Type of device notification'
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Notification message content'
        },
        sent_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When notification was sent'
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the notification has been read'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      console.log('[SERVER] ✅ Created device_notifications table');
      
      // 2. Fix web_notifications table
      if (existingTables.includes('web_notifications')) {
        console.log('[SERVER] Dropping existing web_notifications table...');
        await queryInterface.dropTable('web_notifications', { transaction });
      }
      
      console.log('[SERVER] Creating web_notifications table with correct schema...');
      await queryInterface.createTable('web_notifications', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'User ID reference'
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Notification title'
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'Notification message content'
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'info',
          comment: 'Type of web notification'
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the notification has been read'
        },
        action_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'Optional URL for notification action'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      console.log('[SERVER] ✅ Created web_notifications table');
      
      // Verify the table structures
      const [deviceCols] = await queryInterface.sequelize.query(
        "DESCRIBE device_notifications",
        { transaction }
      );
      
      const [webCols] = await queryInterface.sequelize.query(
        "DESCRIBE web_notifications",
        { transaction }
      );
      
      console.log('[SERVER] Device notifications table columns:', deviceCols.map(col => col.Field));
      console.log('[SERVER] Web notifications table columns:', webCols.map(col => col.Field));
      
      await transaction.commit();
      console.log('[SERVER] ✅ Migration 019 completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('[SERVER] ❌ Migration 019 failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('[SERVER] === REVERTING MIGRATION 019 ===');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop the tables we created
      const existingTables = await queryInterface.showAllTables({ transaction });
      
      if (existingTables.includes('device_notifications')) {
        await queryInterface.dropTable('device_notifications', { transaction });
        console.log('[SERVER] ✅ Dropped device_notifications table');
      }
      
      if (existingTables.includes('web_notifications')) {
        await queryInterface.dropTable('web_notifications', { transaction });
        console.log('[SERVER] ✅ Dropped web_notifications table');
      }
      
      await transaction.commit();
      console.log('[SERVER] ✅ Migration 019 rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('[SERVER] ❌ Migration 019 rollback failed:', error);
      throw error;
    }
  }
};