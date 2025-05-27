
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('=== FORCE PC MIGRATION START ===');
      
      // First, let's check what's currently in the database
      const [results] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
      );
      
      const currentEnum = results[0]?.COLUMN_TYPE || '';
      console.log('Current ENUM before update:', currentEnum);
      
      // Check if PC is already there
      if (currentEnum.includes("'PC'")) {
        console.log('PC already exists in ENUM');
        return;
      }
      
      // Force update the ENUM to include PC
      console.log('Adding PC to device type ENUM...');
      await queryInterface.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
      );
      
      // Verify the change worked
      const [verifyResults] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
      );
      
      const updatedEnum = verifyResults[0]?.COLUMN_TYPE || '';
      console.log('ENUM after update:', updatedEnum);
      
      if (updatedEnum.includes("'PC'")) {
        console.log('✅ PC successfully added to device type ENUM');
      } else {
        console.log('❌ Failed to add PC to device type ENUM');
        throw new Error('Failed to add PC to ENUM');
      }
      
      console.log('=== FORCE PC MIGRATION COMPLETE ===');
    } catch (error) {
      console.error('❌ Error in force PC migration:', error);
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
