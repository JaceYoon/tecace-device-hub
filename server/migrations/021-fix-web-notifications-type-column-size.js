const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Checking web_notifications table...');
      
      // Check if web_notifications table exists
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('web_notifications'));
      
      if (!tableExists) {
        console.log('⚠️ web_notifications table does not exist, skipping migration');
        return;
      }

      // Get current column info
      const tableInfo = await queryInterface.describeTable('web_notifications');
      console.log('📋 Current table structure:', tableInfo);

      // Fix type column size if it's too small
      if (tableInfo.type) {
        console.log('🔧 Updating type column size to VARCHAR(50)...');
        await queryInterface.changeColumn('web_notifications', 'type', {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'info'
        });
        console.log('✅ Type column updated successfully');
      } else {
        console.log('⚠️ Type column not found, adding it...');
        await queryInterface.addColumn('web_notifications', 'type', {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'info'
        });
        console.log('✅ Type column added successfully');
      }

      console.log('✅ web_notifications type column size fix completed');

    } catch (error) {
      console.error('❌ Error in web_notifications type column fix migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Revert type column to smaller size (if needed)
      await queryInterface.changeColumn('web_notifications', 'type', {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'info'
      });
      console.log('✅ Reverted type column size');
    } catch (error) {
      console.error('❌ Error reverting type column:', error);
      throw error;
    }
  }
};