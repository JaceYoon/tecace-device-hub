
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 011: RECREATING DEVICE IMAGES TABLE ===');
    
    try {
      // 1. Drop existing device_images table if it exists
      console.log('📷 Dropping existing device_images table if exists...');
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`device_images\``);
      console.log('✅ Existing device_images table dropped');

      // 2. Create device_images table with proper structure
      console.log('📷 Creating new device_images table...');
      await queryInterface.sequelize.query(`
        CREATE TABLE \`device_images\` (
          \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          \`device_id\` INT NOT NULL,
          \`image_data\` LONGTEXT COMMENT 'Base64 encoded image data',
          \`uploaded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX \`idx_device_id\` (\`device_id\`),
          INDEX \`idx_uploaded_at\` (\`uploaded_at\`),
          
          FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
      `);
      console.log('✅ device_images table created successfully');

      // 3. Migrate existing devicePicture data from devices table
      console.log('🖼️ Migrating existing device pictures...');
      try {
        const devicesWithPictures = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM \`devices\` 
          WHERE \`devicePicture\` IS NOT NULL AND \`devicePicture\` != ''
        `, { type: QueryTypes.SELECT });
        
        if (devicesWithPictures[0].count > 0) {
          console.log(`📸 Found ${devicesWithPictures[0].count} devices with pictures, migrating...`);
          await queryInterface.sequelize.query(`
            INSERT INTO \`device_images\` (\`device_id\`, \`image_data\`, \`uploaded_at\`)
            SELECT \`id\`, \`devicePicture\`, \`createdAt\`
            FROM \`devices\` 
            WHERE \`devicePicture\` IS NOT NULL 
            AND \`devicePicture\` != ''
          `);
          console.log('✅ Device pictures migrated to device_images table');
        } else {
          console.log('📸 No existing device pictures to migrate');
        }
      } catch (error) {
        console.log('⚠️ Could not migrate device pictures:', error.message);
      }

      console.log('✅ Migration 011 completed successfully');
      
    } catch (error) {
      console.error('❌ Migration 011 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 011 ===');
    
    try {
      // Drop device_images table
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`device_images\``);
      console.log('✅ Migration 011 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 011 rollback failed:', error);
      throw error;
    }
  }
};
