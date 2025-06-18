
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 010: CREATING DEVICE IMAGES TABLE AND PERFORMANCE INDEXES ===');
    
    try {
      // 1. device_images 테이블 생성
      console.log('📷 Creating device_images table...');
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`device_images\` (
          \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          \`device_id\` INT NOT NULL,
          \`image_url\` VARCHAR(500),
          \`thumbnail_url\` VARCHAR(500),
          \`image_data\` LONGTEXT COMMENT 'Base64 encoded image data',
          \`file_size\` INT,
          \`mime_type\` VARCHAR(100),
          \`uploaded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX \`idx_device_id\` (\`device_id\`),
          INDEX \`idx_uploaded_at\` (\`uploaded_at\`),
          
          FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
      `);
      console.log('✅ device_images table created');

      // 2. projects 테이블 생성
      console.log('📁 Creating projects table...');
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`projects\` (
          \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL COLLATE utf8mb4_uca1400_ai_ci,
          \`project_group\` VARCHAR(255) NOT NULL COLLATE utf8mb4_uca1400_ai_ci,
          \`description\` TEXT,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          UNIQUE KEY \`idx_name_group\` (\`name\`, \`project_group\`),
          INDEX \`idx_project_group\` (\`project_group\`),
          INDEX \`idx_name\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
      `);
      console.log('✅ projects table created');

      // 3. 기존 project 데이터 마이그레이션
      console.log('📊 Migrating existing project data...');
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO \`projects\` (\`name\`, \`project_group\`)
        SELECT DISTINCT \`project\`, \`projectGroup\` 
        FROM \`devices\` 
        WHERE \`project\` IS NOT NULL AND \`projectGroup\` IS NOT NULL
      `);
      console.log('✅ Project data migrated');

      // 4. devices 테이블에 project_id 컬럼 추가
      console.log('🔗 Adding project_id column to devices...');
      const [projectIdExists] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'devices' 
        AND column_name = 'project_id'
      `);
      
      if (projectIdExists[0].count === 0) {
        await queryInterface.sequelize.query(`
          ALTER TABLE \`devices\` ADD COLUMN \`project_id\` INT NULL,
          ADD INDEX \`idx_project_id\` (\`project_id\`)
        `);
        console.log('✅ Added project_id column and index');
      }

      // 5. project_id 값 업데이트 (collation 명시)
      console.log('🔄 Updating project_id values...');
      await queryInterface.sequelize.query(`
        UPDATE \`devices\` d
        INNER JOIN \`projects\` p ON d.\`project\` COLLATE utf8mb4_uca1400_ai_ci = p.\`name\` 
          AND d.\`projectGroup\` COLLATE utf8mb4_uca1400_ai_ci = p.\`project_group\`
        SET d.\`project_id\` = p.\`id\`
        WHERE d.\`project_id\` IS NULL
      `);

      // 6. 기존 devicePicture 데이터를 device_images로 마이그레이션
      console.log('🖼️ Migrating existing device pictures...');
      const [devicesWithPictures] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM \`devices\` 
        WHERE \`devicePicture\` IS NOT NULL AND \`devicePicture\` != ''
      `);
      
      if (devicesWithPictures[0].count > 0) {
        console.log(`📸 Found ${devicesWithPictures[0].count} devices with pictures, migrating...`);
        await queryInterface.sequelize.query(`
          INSERT IGNORE INTO \`device_images\` (\`device_id\`, \`image_data\`, \`uploaded_at\`)
          SELECT \`id\`, \`devicePicture\`, \`createdAt\`
          FROM \`devices\` 
          WHERE \`devicePicture\` IS NOT NULL 
          AND \`devicePicture\` != ''
        `);
        console.log('✅ Device pictures migrated to device_images table');
      }

      // 7. 성능 인덱스 추가
      console.log('🚀 Adding performance indexes...');
      const deviceIndexes = [
        { name: 'idx_project_status', columns: '(`project`, `status`)' },
        { name: 'idx_project_group_status', columns: '(`projectGroup`, `status`)' },
        { name: 'idx_type_status', columns: '(`type`, `status`)' },
        { name: 'idx_device_type_status', columns: '(`deviceType`, `status`)' },
        { name: 'idx_assigned_status', columns: '(`assignedToId`, `status`)' },
        { name: 'idx_status_created', columns: '(`status`, `createdAt`)' },
        { name: 'idx_created_at', columns: '(`createdAt`)' },
        { name: 'idx_updated_at', columns: '(`updatedAt`)' },
        { name: 'idx_imei', columns: '(`imei`)' },
        { name: 'idx_serial_number', columns: '(`serialNumber`)' }
      ];
      
      for (const index of deviceIndexes) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE \`devices\` ADD INDEX \`${index.name}\` ${index.columns}
          `);
          console.log(`✅ Added index: ${index.name}`);
        } catch (error) {
          if (error.message.includes('Duplicate key name')) {
            console.log(`⚠️ Index ${index.name} already exists, skipping...`);
          }
        }
      }

      console.log('✅ Migration 010 completed successfully');
      
    } catch (error) {
      console.error('❌ Migration 010 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 010 ===');
    
    try {
      // 인덱스 제거
      const deviceIndexes = [
        'idx_serial_number', 'idx_imei', 'idx_updated_at', 'idx_created_at',
        'idx_status_created', 'idx_assigned_status', 'idx_device_type_status',
        'idx_type_status', 'idx_project_group_status', 'idx_project_status',
        'idx_project_id'
      ];
      
      for (const index of deviceIndexes) {
        try {
          await queryInterface.sequelize.query(`ALTER TABLE \`devices\` DROP INDEX \`${index}\``);
        } catch (error) {
          console.log(`⚠️ Index ${index} may not exist, continuing...`);
        }
      }
      
      // project_id 컬럼 제거
      try {
        await queryInterface.sequelize.query(`ALTER TABLE \`devices\` DROP COLUMN \`project_id\``);
      } catch (error) {
        console.log('⚠️ project_id column may not exist, continuing...');
      }
      
      // 테이블 제거
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`device_images\``);
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`projects\``);
      
      console.log('✅ Migration 010 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 010 rollback failed:', error);
      throw error;
    }
  }
};
