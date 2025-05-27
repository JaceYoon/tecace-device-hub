
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('=== DIRECT PC MIGRATION (008) START ===');
      
      // First check if the devices table exists
      const tableExists = await queryInterface.tableExists('devices');
      if (!tableExists) {
        console.log('❌ Devices table does not exist. Skipping migration.');
        return;
      }

      console.log('🔄 Directly updating device type ENUM to include PC...');
      
      // Directly update the ENUM without checking current values
      await queryInterface.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
      );
      
      console.log('✅ PC successfully added to device type ENUM');
      console.log('=== DIRECT PC MIGRATION (008) COMPLETE ===');
      
    } catch (error) {
      console.error('❌ Error in direct PC migration:', error);
      // Don't throw error if PC already exists in ENUM
      if (error.message && error.message.includes('Duplicate entry')) {
        console.log('PC already exists in ENUM, continuing...');
        return;
      }
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
