
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add PC to the existing device type ENUM
    await queryInterface.sequelize.query(
      "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove PC from the ENUM (this will fail if there are devices with type 'PC')
    await queryInterface.sequelize.query(
      "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'Accessory', 'Other') NOT NULL"
    );
  }
};
