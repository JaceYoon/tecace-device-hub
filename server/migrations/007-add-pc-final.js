
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('=== FINAL PC MIGRATION (007) START ===');
      
      // First check if the devices table exists
      const tableExists = await queryInterface.tableExists('devices');
      if (!tableExists) {
        console.log('❌ Devices table does not exist. Skipping migration.');
        return;
      }

      // Get current ENUM values
      const [results] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
      );
      
      const columnType = results[0]?.COLUMN_TYPE || '';
      console.log('Current device type ENUM:', columnType);
      
      // Check if PC is already in the ENUM
      if (columnType.includes("'PC'")) {
        console.log('✅ PC already exists in device type ENUM');
        return;
      }

      console.log('🔄 Adding PC to device type ENUM...');
      
      // Use ALTER TABLE to modify the ENUM
      await queryInterface.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
      );
      
      // Verify the change
      const [verifyResults] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
      );
      
      const updatedEnum = verifyResults[0]?.COLUMN_TYPE || '';
      console.log('Updated device type ENUM:', updatedEnum);
      
      if (updatedEnum.includes("'PC'")) {
        console.log('✅ PC successfully added to device type ENUM');
      } else {
        console.log('❌ Failed to add PC to device type ENUM');
        throw new Error('PC was not added to ENUM');
      }
      
      console.log('=== FINAL PC MIGRATION (007) COMPLETE ===');
      
    } catch (error) {
      console.error('❌ Error in final PC migration:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Removing PC from device type ENUM...');
      await queryInterface.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'Accessory', 'Other') NOT NULL"
      );
      console.log('PC removed from device type ENUM');
    } catch (error) {
      console.error('Error removing PC from ENUM:', error);
      throw error;
    }
  }
};
