
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
      
      // Step 3: Drop the old memo column if it still exists
      try {
        console.log('Checking if memo column still exists...');
        const tableDescription = await queryInterface.describeTable('devices');
        if (tableDescription.memo) {
          console.log('Dropping memo column...');
          await queryInterface.removeColumn('devices', 'memo');
        } else {
          console.log('Memo column already removed or renamed');
        }
      } catch (memoError) {
        console.log('Memo column does not exist or already removed');
      }
      
      console.log('✅ Migration completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== REVERTING NOTES AND MEMO FIELDS ===');
    
    try {
      // Add memo column back
      console.log('Adding memo column back...');
      await queryInterface.addColumn('devices', 'memo', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
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
