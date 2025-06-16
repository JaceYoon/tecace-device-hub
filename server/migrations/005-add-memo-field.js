
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('=== CHECKING MEMO FIELD MIGRATION ===');
      
      // Check if memo column already exists
      const results = await queryInterface.sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'memo' AND TABLE_SCHEMA = DATABASE()",
        { 
          type: queryInterface.sequelize.QueryTypes.SELECT,
          raw: true
        }
      );
      
      if (results && results.length > 0) {
        console.log('✅ Memo field already exists, skipping migration');
        return;
      }
      
      console.log('🔄 Adding memo field to devices table...');
      
      await queryInterface.addColumn('devices', 'memo', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Memo field for additional device information'
      });
      
      console.log('✅ Memo field added successfully');
      
    } catch (error) {
      console.error('Error in memo field migration:', error);
      
      // Check if it's a duplicate column error - if so, consider it successful
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Memo field already exists (detected during add attempt)');
        return;
      }
      
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('devices', 'memo');
      console.log('Removed memo column from devices table');
    } catch (error) {
      console.error('Error removing memo column:', error);
      throw error;
    }
  }
};
