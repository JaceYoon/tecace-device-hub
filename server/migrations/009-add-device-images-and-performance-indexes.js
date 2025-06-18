
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 009: ADDING DEVICE IMAGES TABLE AND PERFORMANCE INDEXES (MariaDB) ===');
    
    try {
      // 0. 테이블 존재 확인 및 강제 재실행 감지
      console.log('🔍 Checking table existence...');
      const [deviceImagesExists] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'device_images'
      `);
      
      const [projectsExists] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'projects'
      `);
      
      const deviceImagesTableExists = deviceImagesExists[0].count > 0;
      const projectsTableExists = projectsExists[0].count > 0;
      
      console.log('📊 Table status:');
      console.log(`  - device_images: ${deviceImagesTableExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`  - projects: ${projectsTableExists ? 'EXISTS' : 'MISSING'}`);
      
      // 1. 새로운 device_images 테이블 생성 (MariaDB 문법)
      if (!deviceImagesTableExists) {
        console.log('📷 Creating device_images table...');
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS \`device_images\` (
            \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            \`device_id\` INT NOT NULL,
            \`image_url\` VARCHAR(500),
            \`thumbnail_url\` VARCHAR(500),
            \`image_data\` LONGTEXT COMMENT 'Temporary field for migration from devicePicture',
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
      } else {
        console.log('⚠️ device_images table already exists, skipping creation...');
      }
      
      // 2. projects 정규화 테이블 생성 (기존 devices 테이블과 동일한 collation 사용)
      if (!projectsTableExists) {
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
      } else {
        console.log('⚠️ projects table already exists, skipping creation...');
      }
      
      // 3. devices 테이블 성능 개선 인덱스 추가 (안전하게 하나씩)
      console.log('🚀 Adding performance indexes to devices table...');
      
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
        { name: 'idx_serial_number', columns: '(`serialNumber`)' },
        { name: 'idx_project', columns: '(`project`)' },
        { name: 'idx_project_group', columns: '(`projectGroup`)' }
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
          } else {
            console.error(`❌ Failed to add index ${index.name}:`, error.message);
          }
        }
      }
      
      // 4. requests 테이블 성능 개선 인덱스
      console.log('📋 Adding performance indexes to requests table...');
      
      const requestIndexes = [
        { name: 'idx_device_status', columns: '(`deviceId`, `status`)' },
        { name: 'idx_user_status', columns: '(`userId`, `status`)' },
        { name: 'idx_type_status', columns: '(`type`, `status`)' },
        { name: 'idx_requested_at', columns: '(`requestedAt`)' },
        { name: 'idx_processed_at', columns: '(`processedAt`)' }
      ];
      
      for (const index of requestIndexes) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE \`requests\` ADD INDEX \`${index.name}\` ${index.columns}
          `);
          console.log(`✅ Added requests index: ${index.name}`);
        } catch (error) {
          if (error.message.includes('Duplicate key name')) {
            console.log(`⚠️ Requests index ${index.name} already exists, skipping...`);
          } else {
            console.error(`❌ Failed to add requests index ${index.name}:`, error.message);
          }
        }
      }
      
      // 5. 기존 projects 데이터를 새 projects 테이블로 복사 (안전하게)
      if (!projectsTableExists) {
        console.log('📊 Migrating existing project data...');
        await queryInterface.sequelize.query(`
          INSERT IGNORE INTO \`projects\` (\`name\`, \`project_group\`)
          SELECT DISTINCT \`project\`, \`projectGroup\` 
          FROM \`devices\` 
          WHERE \`project\` IS NOT NULL AND \`projectGroup\` IS NOT NULL
        `);
        console.log('✅ Project data migrated');
      } else {
        console.log('⚠️ Projects table exists, ensuring data is up to date...');
        await queryInterface.sequelize.query(`
          INSERT IGNORE INTO \`projects\` (\`name\`, \`project_group\`)
          SELECT DISTINCT \`project\`, \`projectGroup\` 
          FROM \`devices\` 
          WHERE \`project\` IS NOT NULL AND \`projectGroup\` IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM \`projects\` p 
            WHERE p.\`name\` = \`devices\`.\`project\` 
            AND p.\`project_group\` = \`devices\`.\`projectGroup\`
          )
        `);
      }
      
      // 6. devices 테이블에 project_id 컬럼 추가 (NULL 허용으로 안전하게)
      console.log('🔗 Adding project_id column to devices...');
      try {
        const [projectIdExists] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'devices' 
          AND column_name = 'project_id'
        `);
        
        if (projectIdExists[0].count === 0) {
          await queryInterface.sequelize.query(`
            ALTER TABLE \`devices\` ADD COLUMN \`project_id\` INT NULL
          `);
          console.log('✅ Added project_id column');
        } else {
          console.log('⚠️ project_id column already exists, skipping...');
        }
      } catch (error) {
        console.error('❌ Failed to add project_id column:', error.message);
      }
      
      // 7. project_id 인덱스 생성
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE \`devices\` ADD INDEX \`idx_project_id\` (\`project_id\`)
        `);
        console.log('✅ Added project_id index');
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log('⚠️ project_id index already exists, skipping...');
        } else {
          console.error('❌ Failed to add project_id index:', error.message);
        }
      }
      
      // 8. project_id 값 업데이트 (기존 데이터 기반) - collation 문제 해결
      console.log('🔄 Updating project_id values...');
      await queryInterface.sequelize.query(`
        UPDATE \`devices\` d
        INNER JOIN \`projects\` p ON d.\`project\` COLLATE utf8mb4_uca1400_ai_ci = p.\`name\` 
          AND d.\`projectGroup\` COLLATE utf8mb4_uca1400_ai_ci = p.\`project_group\`
        SET d.\`project_id\` = p.\`id\`
        WHERE d.\`project_id\` IS NULL
      `);
      
      // 9. 기존 devicePicture 데이터를 device_images로 마이그레이션 (선택사항)
      console.log('🖼️ Checking for existing device pictures to migrate...');
      const [devicesWithPictures] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM \`devices\` 
        WHERE \`devicePicture\` IS NOT NULL AND \`devicePicture\` != ''
      `);
      
      if (devicesWithPictures[0].count > 0) {
        console.log(`📸 Found ${devicesWithPictures[0].count} devices with pictures, migrating to device_images...`);
        await queryInterface.sequelize.query(`
          INSERT IGNORE INTO \`device_images\` (\`device_id\`, \`image_data\`, \`uploaded_at\`)
          SELECT \`id\`, \`devicePicture\`, \`createdAt\`
          FROM \`devices\` 
          WHERE \`devicePicture\` IS NOT NULL 
          AND \`devicePicture\` != ''
          AND NOT EXISTS (
            SELECT 1 FROM \`device_images\` di WHERE di.\`device_id\` = \`devices\`.\`id\`
          )
        `);
        console.log('✅ Device pictures migrated to device_images table');
      } else {
        console.log('📷 No device pictures found to migrate');
      }
      
      console.log('✅ Migration 009 completed successfully');
      console.log('📈 Performance indexes added for better query performance');
      console.log('📷 Device images table ready for future image optimization');
      console.log('📁 Projects table created for data normalization');
      console.log('🛡️ All existing data preserved - zero data loss!');
      
    } catch (error) {
      console.error('❌ Migration 009 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 009 ===');
    
    try {
      // 인덱스 제거 (역순으로)
      console.log('🗑️ Removing performance indexes...');
      
      // devices 테이블 인덱스 제거
      const deviceIndexes = [
        'idx_project_id', 'idx_project_group', 'idx_project', 'idx_serial_number', 
        'idx_imei', 'idx_updated_at', 'idx_created_at', 'idx_status_created',
        'idx_assigned_status', 'idx_device_type_status', 'idx_type_status',
        'idx_project_group_status', 'idx_project_status'
      ];
      
      for (const index of deviceIndexes) {
        try {
          await queryInterface.sequelize.query(`ALTER TABLE \`devices\` DROP INDEX \`${index}\``);
        } catch (error) {
          console.log(`⚠️ Index ${index} may not exist, continuing...`);
        }
      }
      
      // requests 테이블 인덱스 제거
      const requestIndexes = [
        'idx_processed_at', 'idx_requested_at', 'idx_type_status', 
        'idx_user_status', 'idx_device_status'
      ];
      
      for (const index of requestIndexes) {
        try {
          await queryInterface.sequelize.query(`ALTER TABLE \`requests\` DROP INDEX \`${index}\``);
        } catch (error) {
          console.log(`⚠️ Requests index ${index} may not exist, continuing...`);
        }
      }
      
      // project_id 컬럼 제거
      console.log('🔗 Removing project_id column...');
      try {
        await queryInterface.sequelize.query(`ALTER TABLE \`devices\` DROP COLUMN \`project_id\``);
      } catch (error) {
        console.log('⚠️ project_id column may not exist, continuing...');
      }
      
      // 테이블 제거
      console.log('🗑️ Removing new tables...');
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`device_images\``);
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`projects\``);
      
      console.log('✅ Migration 009 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 009 rollback failed:', error);
      throw error;
    }
  }
};
