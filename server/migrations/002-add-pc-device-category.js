
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if PC is already in the ENUM
      const [results] = await queryInterface.sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type'"
      );
      
      const columnType = results[0]?.COLUMN_TYPE || '';
      
      // Only add PC if it's not already in the ENUM
      if (!columnType.includes("'PC'")) {
        await queryInterface.sequelize.query(
          "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
        );
        console.log('Successfully added PC to device type ENUM');
      } else {
        console.log('PC already exists in device type ENUM');
      }
    } catch (error) {
      console.error('Error adding PC to device type ENUM:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove PC from the ENUM (this will fail if there are devices with type 'PC')
    await queryInterface.sequelize.query(
      "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'Accessory', 'Other') NOT NULL"
    );
  }
};
