
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 009: ADDING DEVICE IMAGES TABLE AND PERFORMANCE INDEXES ===');
    
    try {
      // 1. 새로운 device_images 테이블 생성
      console.log('📷 Creating device_images table...');
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "device_images" (
          "id" SERIAL PRIMARY KEY,
          "device_id" INTEGER NOT NULL,
          "image_url" VARCHAR(500),
          "thumbnail_url" VARCHAR(500),
          "image_data" TEXT,
          "file_size" INTEGER,
          "mime_type" VARCHAR(100),
          "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 2. device_images 테이블 인덱스 생성
      console.log('📝 Creating device_images indexes...');
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_device_images_device_id" ON "device_images"("device_id")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_device_images_uploaded_at" ON "device_images"("uploaded_at")
      `);
      
      // 3. projects 정규화 테이블 생성
      console.log('📁 Creating projects table...');
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "projects" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "project_group" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 4. projects 테이블 인덱스
      console.log('📝 Creating projects indexes...');
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_projects_name_group" ON "projects"("name", "project_group")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_projects_project_group" ON "projects"("project_group")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_projects_name" ON "projects"("name")
      `);
      
      // 5. devices 테이블 성능 개선 인덱스 추가
      console.log('🚀 Adding performance indexes to devices table...');
      
      // 복합 인덱스들
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_project_status" ON "devices"("project", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_project_group_status" ON "devices"("projectGroup", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_type_status" ON "devices"("type", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_device_type_status" ON "devices"("deviceType", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_assigned_status" ON "devices"("assignedToId", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_status_created" ON "devices"("status", "createdAt")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_created_at" ON "devices"("createdAt")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_updated_at" ON "devices"("updatedAt")
      `);
      
      // 개별 검색용 인덱스들
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_imei" ON "devices"("imei")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_serial_number" ON "devices"("serialNumber")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_project" ON "devices"("project")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_project_group" ON "devices"("projectGroup")
      `);
      
      // 6. requests 테이블 성능 개선 인덱스
      console.log('📋 Adding performance indexes to requests table...');
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_requests_device_status" ON "requests"("deviceId", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_requests_user_status" ON "requests"("userId", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_requests_type_status" ON "requests"("type", "status")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_requests_requested_at" ON "requests"("requestedAt")
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_requests_processed_at" ON "requests"("processedAt")
      `);
      
      // 7. 기존 projects 데이터를 새 projects 테이블로 복사
      console.log('📊 Migrating existing project data...');
      await queryInterface.sequelize.query(`
        INSERT INTO "projects" ("name", "project_group")
        SELECT DISTINCT "project", "projectGroup" 
        FROM "devices" 
        WHERE "project" IS NOT NULL AND "projectGroup" IS NOT NULL
        ON CONFLICT ("name", "project_group") DO NOTHING
      `);
      
      // 8. devices 테이블에 project_id 컬럼 추가
      console.log('🔗 Adding project_id column to devices...');
      await queryInterface.sequelize.query(`
        ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "project_id" INTEGER
      `);
      
      // 9. project_id 인덱스 생성
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_devices_project_id" ON "devices"("project_id")
      `);
      
      // 10. project_id 값 업데이트 (기존 데이터 기반)
      console.log('🔄 Updating project_id values...');
      await queryInterface.sequelize.query(`
        UPDATE "devices" 
        SET "project_id" = p."id"
        FROM "projects" p 
        WHERE "devices"."project" = p."name" 
          AND "devices"."projectGroup" = p."project_group" 
          AND "devices"."project_id" IS NULL
      `);
      
      console.log('✅ Migration 009 completed successfully');
      console.log('📈 Performance indexes added for better query performance');
      console.log('📷 Device images table ready for future image optimization');
      console.log('📁 Projects table created for data normalization');
      
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
        'idx_devices_project_id',
        'idx_devices_project_group',
        'idx_devices_project',
        'idx_devices_serial_number',
        'idx_devices_imei',
        'idx_devices_updated_at',
        'idx_devices_created_at',
        'idx_devices_status_created',
        'idx_devices_assigned_status',
        'idx_devices_device_type_status',
        'idx_devices_type_status',
        'idx_devices_project_group_status',
        'idx_devices_project_status'
      ];
      
      for (const index of deviceIndexes) {
        await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index}"`);
      }
      
      // requests 테이블 인덱스 제거
      const requestIndexes = [
        'idx_requests_processed_at',
        'idx_requests_requested_at',
        'idx_requests_type_status',
        'idx_requests_user_status',
        'idx_requests_device_status'
      ];
      
      for (const index of requestIndexes) {
        await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index}"`);
      }
      
      // project_id 컬럼 제거
      console.log('🔗 Removing project_id column...');
      await queryInterface.sequelize.query(`
        ALTER TABLE "devices" DROP COLUMN IF EXISTS "project_id"
      `);
      
      // 테이블 제거
      console.log('🗑️ Removing new tables...');
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "device_images"`);
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "projects"`);
      
      console.log('✅ Migration 009 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 009 rollback failed:', error);
      throw error;
    }
  }
};
