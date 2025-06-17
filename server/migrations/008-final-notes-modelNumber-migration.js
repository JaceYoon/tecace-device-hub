
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== 008: FINAL NOTES TO MODELNUMBER AND NEW NOTES MIGRATION ===');
    
    try {
      // First check if modelNumber column already exists
      const [modelNumberExists] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM devices WHERE Field = 'modelNumber'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (!modelNumberExists || modelNumberExists.length === 0) {
        // Step 1: Rename 'notes' column to 'modelNumber'
        console.log('Renaming notes column to modelNumber...');
        await queryInterface.renameColumn('devices', 'notes', 'modelNumber');
        console.log('✅ Successfully renamed notes to modelNumber');
      } else {
        console.log('✅ modelNumber column already exists, skipping rename');
      }
      
      // Check if new notes column already exists
      const [newNotesExists] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM devices WHERE Field = 'notes'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (!newNotesExists || newNotesExists.length === 0) {
        // Step 2: Add new 'notes' column for additional device information
        console.log('Adding new notes column...');
        await queryInterface.addColumn('devices', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Notes field for additional device information'
        });
        console.log('✅ Successfully added new notes column');
      } else {
        console.log('✅ New notes column already exists, skipping addition');
      }
      
      console.log('✅ Migration 008 completed successfully');
      
    } catch (error) {
      console.error('❌ Migration 008 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== REVERTING 008: NOTES AND MODEL NUMBER FIELDS ===');
    
    try {
      // Remove the new notes column
      console.log('Removing new notes column...');
      await queryInterface.removeColumn('devices', 'notes');
      
      // Revert modelNumber back to notes
      console.log('Reverting modelNumber column back to notes...');
      await queryInterface.renameColumn('devices', 'modelNumber', 'notes');
      
      console.log('✅ Migration 008 reverted successfully');
      
    } catch (error) {
      console.error('❌ Migration 008 revert failed:', error);
      throw error;
    }
  }
};
