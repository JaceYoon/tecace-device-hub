const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration 014: Adding rental period to requests table...');
    
    try {
      // Add rentalPeriodDays column to requests table
      await queryInterface.addColumn('requests', 'rentalPeriodDays', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Rental period in days for assign requests',
        validate: {
          min: 7,
          max: 365
        }
      });
      
      console.log('Migration 014: Successfully added rentalPeriodDays column to requests table');
      
    } catch (error) {
      console.error('Migration 014 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration 014: Rolling back rental period from requests table...');
    
    try {
      // Remove rentalPeriodDays column from requests table
      await queryInterface.removeColumn('requests', 'rentalPeriodDays');
      
      console.log('Migration 014: Successfully removed rentalPeriodDays column from requests table');
      
    } catch (error) {
      console.error('Migration 014 rollback failed:', error);
      throw error;
    }
  }
};