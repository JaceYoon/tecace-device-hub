
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== RENAMING NOTES FIELD AND ADDING NEW NOTES COLUMN ===');
    
    try {
      // Step 1: Rename 'notes' column to 'modelNumber'
      console.log('Renaming notes column to modelNumber...');
      await queryInterface.renameColumn('devices', 'notes', 'modelNumber');
      
      // Step 2: Add new 'notes' column for additional device information
      console.log('Adding new notes column...');
      await queryInterface.addColumn('devices', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes field for additional device information'
      });
      
      console.log('✅ Migration completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== REVERTING NOTES AND MODEL NUMBER FIELDS ===');
    
    try {
      // Remove the new notes column
      console.log('Removing notes column...');
      await queryInterface.removeColumn('devices', 'notes');
      
      // Revert modelNumber back to notes
      console.log('Reverting modelNumber column back to notes...');
      await queryInterface.renameColumn('devices', 'modelNumber', 'notes');
      
      console.log('✅ Migration reverted successfully');
      
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }
};
