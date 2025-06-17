
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== RENAMING NOTES AND MEMO FIELDS ===');
    
    try {
      // Step 1: Rename 'notes' column to 'modelNumber'
      console.log('Renaming notes column to modelNumber...');
      await queryInterface.renameColumn('devices', 'notes', 'modelNumber');
      
      // Step 2: Rename 'memo' column to 'notes'
      console.log('Renaming memo column to notes...');
      await queryInterface.renameColumn('devices', 'memo', 'notes');
      
      console.log('✅ Migration completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== REVERTING NOTES AND MEMO FIELDS ===');
    
    try {
      // Revert the changes
      console.log('Reverting notes column to memo...');
      await queryInterface.renameColumn('devices', 'notes', 'memo');
      
      console.log('Reverting modelNumber column to notes...');
      await queryInterface.renameColumn('devices', 'modelNumber', 'notes');
      
      console.log('✅ Migration reverted successfully');
      
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }
};
