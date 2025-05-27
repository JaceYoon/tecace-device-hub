
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('=== FINAL PC MIGRATION START ===');
      
      // Get current ENUM values
      const [results] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
      );
      
      const columnType = results[0]?.COLUMN_TYPE || '';
      console.log('Current device type ENUM values:', columnType);
      
      // Check if PC is already in the ENUM
      if (!columnType.includes("'PC'")) {
        console.log('PC not found in ENUM, adding it now...');
        
        // Add PC to the ENUM - make sure to include all existing values
        await queryInterface.sequelize.query(
          "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
        );
        
        console.log('Successfully added PC to device type ENUM');
        
        // Verify the change
        const [verifyResults] = await queryInterface.sequelize.query(
          "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
        );
        console.log('Updated ENUM values:', verifyResults[0]?.COLUMN_TYPE);
        
      } else {
        console.log('PC already exists in device type ENUM');
      }
      
      console.log('=== FINAL PC MIGRATION COMPLETE ===');
    } catch (error) {
      console.error('Error in final PC migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove PC from the ENUM (this will fail if there are devices with type 'PC')
      await queryInterface.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'Accessory', 'Other') NOT NULL"
      );
      console.log('Removed PC from device type ENUM');
    } catch (error) {
      console.error('Error removing PC from ENUM:', error);
      throw error;
    }
  }
};
