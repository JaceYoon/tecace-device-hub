
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== RENAMING NOTES AND MEMO FIELDS ===');
    
    try {
      // Step 1: Add new modelNumber column
      console.log('Adding modelNumber column...');
      await queryInterface.addColumn('devices', 'modelNumber', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Model number of the device (previously notes field)'
      });
      
      // Step 2: Copy data from notes to modelNumber
      console.log('Copying data from notes to modelNumber...');
      await queryInterface.sequelize.query(
        'UPDATE devices SET modelNumber = notes WHERE notes IS NOT NULL'
      );
      
      // Step 3: Add new notes column
      console.log('Adding new notes column...');
      await queryInterface.addColumn('devices', 'notes_new', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes field for additional device information (previously memo field)'
      });
      
      // Step 4: Copy data from memo to notes_new
      console.log('Copying data from memo to notes_new...');
      await queryInterface.sequelize.query(
        'UPDATE devices SET notes_new = memo WHERE memo IS NOT NULL'
      );
      
      // Step 5: Drop old memo column
      console.log('Dropping old memo column...');
      await queryInterface.removeColumn('devices', 'memo');
      
      // Step 6: Rename notes_new to notes (this will replace the old notes column)
      console.log('Dropping old notes column...');
      await queryInterface.removeColumn('devices', 'notes');
      
      console.log('Renaming notes_new to notes...');
      await queryInterface.renameColumn('devices', 'notes_new', 'notes');
      
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
      await queryInterface.addColumn('devices', 'memo', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Memo field for additional device information'
      });
      
      // Copy notes back to memo
      await queryInterface.sequelize.query(
        'UPDATE devices SET memo = notes WHERE notes IS NOT NULL'
      );
      
      // Rename notes to notes_old temporarily
      await queryInterface.renameColumn('devices', 'notes', 'notes_old');
      
      // Add original notes column
      await queryInterface.addColumn('devices', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      // Copy modelNumber back to notes
      await queryInterface.sequelize.query(
        'UPDATE devices SET notes = modelNumber WHERE modelNumber IS NOT NULL'
      );
      
      // Remove the new columns
      await queryInterface.removeColumn('devices', 'modelNumber');
      await queryInterface.removeColumn('devices', 'notes_old');
      
      console.log('✅ Migration reverted successfully');
      
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }
};
