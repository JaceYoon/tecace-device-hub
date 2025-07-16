const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 015: ADDING TYPE COLUMN TO DEVICE NOTIFICATIONS ===');
    
    try {
      // Check if device_notifications table exists and if type column already exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('device_notifications')) {
        console.log('⚠️ device_notifications table does not exist, skipping...');
        return;
      }

      // Check if type column already exists
      const columns = await queryInterface.describeTable('device_notifications');
      if (columns.type) {
        console.log('✅ type column already exists in device_notifications table');
        return;
      }

      console.log('Adding type column to device_notifications table...');
      
      // Add type column with enum values
      await queryInterface.addColumn('device_notifications', 'type', {
        type: Sequelize.ENUM('expiring_soon', 'overdue', 'returned', 'return_request'),
        allowNull: true,
        defaultValue: 'expiring_soon',
        comment: 'Type of device notification'
      });

      // Update existing rows to have default type
      await queryInterface.sequelize.query(`
        UPDATE device_notifications 
        SET type = 'expiring_soon' 
        WHERE type IS NULL
      `, {
        type: QueryTypes.UPDATE
      });

      // Make the column not null after setting default values
      await queryInterface.changeColumn('device_notifications', 'type', {
        type: Sequelize.ENUM('expiring_soon', 'overdue', 'returned', 'return_request'),
        allowNull: false,
        defaultValue: 'expiring_soon',
        comment: 'Type of device notification'
      });

      console.log('✅ Added type column to device_notifications table');

      // Also add is_read column if it doesn't exist
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

      // Add message column if it doesn't exist
      if (!columns.message) {
        console.log('Adding message column to device_notifications table...');
        
        await queryInterface.addColumn('device_notifications', 'message', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Notification message content'
        });

        console.log('✅ Added message column to device_notifications table');
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

      const columns = await queryInterface.describeTable('device_notifications');
      
      // Remove type column if it exists
      if (columns.type) {
        await queryInterface.removeColumn('device_notifications', 'type');
        console.log('✅ Removed type column from device_notifications table');
      }

      // Remove is_read column if it was added by this migration
      if (columns.is_read) {
        await queryInterface.removeColumn('device_notifications', 'is_read');
        console.log('✅ Removed is_read column from device_notifications table');
      }

      // Remove message column if it was added by this migration
      if (columns.message) {
        await queryInterface.removeColumn('device_notifications', 'message');
        console.log('✅ Removed message column from device_notifications table');
      }
      
      console.log('✅ MIGRATION 015 ROLLBACK COMPLETED');
      
    } catch (error) {
      console.error('❌ MIGRATION 015 ROLLBACK FAILED:', error);
      throw error;
    }
  }
};