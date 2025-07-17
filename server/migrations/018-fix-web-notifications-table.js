const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('[SERVER] === MIGRATION 018: FIX WEB NOTIFICATIONS TABLE ===');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if web_notifications table exists and drop it
      const [results] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'web_notifications'",
        { transaction }
      );
      
      if (results.length > 0) {
        console.log('[SERVER] Dropping existing web_notifications table...');
        await queryInterface.dropTable('web_notifications', { transaction });
        console.log('[SERVER] ✅ Dropped existing web_notifications table');
      }
      
      // Create web_notifications table with all required columns
      console.log('[SERVER] Creating web_notifications table with all required columns...');
      await queryInterface.createTable('web_notifications', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'info'
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        action_url: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      console.log('[SERVER] ✅ Created web_notifications table with all required columns');
      
      // Verify the table structure
      const [columns] = await queryInterface.sequelize.query(
        "DESCRIBE web_notifications",
        { transaction }
      );
      
      console.log('[SERVER] Web notifications table columns:', columns.map(col => col.Field));
      
      await transaction.commit();
      console.log('[SERVER] ✅ Migration 018 completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('[SERVER] ❌ Migration 018 failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('[SERVER] === REVERTING MIGRATION 018 ===');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if web_notifications table exists and drop it
      const [results] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'web_notifications'",
        { transaction }
      );
      
      if (results.length > 0) {
        await queryInterface.dropTable('web_notifications', { transaction });
        console.log('[SERVER] ✅ Dropped web_notifications table');
      }
      
      await transaction.commit();
      console.log('[SERVER] ✅ Migration 018 rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('[SERVER] ❌ Migration 018 rollback failed:', error);
      throw error;
    }
  }
};