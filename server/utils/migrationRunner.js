
const fs = require('fs');
const path = require('path');

const runMigrations = async (sequelize) => {
  try {
    console.log('=== CHECKING FOR PENDING MIGRATIONS ===');
    
    // Create migrations table if it doesn't exist (MariaDB syntax)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`SequelizeMeta\` (
        \`name\` VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    // Get already executed migrations - use raw query with proper options
    const executedMigrations = await sequelize.query(
      'SELECT name FROM `SequelizeMeta` ORDER BY name',
      { 
        type: sequelize.QueryTypes.SELECT,
        raw: true
      }
    );
    
    const executedNames = executedMigrations.map(m => m.name);
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => 
      !executedNames.includes(file)
    );
    
    // Special check for migration 009 - if tables are missing, force re-run
    const migration009File = '009-add-device-images-and-performance-indexes.js';
    if (executedNames.includes(migration009File) && !pendingMigrations.includes(migration009File)) {
      try {
        console.log('🔍 Checking if migration 009 tables exist...');
        const [deviceImagesExists] = await sequelize.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'device_images'
        `);
        
        const [projectsExists] = await sequelize.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'projects'
        `);
        
        const deviceImagesTableExists = deviceImagesExists[0].count > 0;
        const projectsTableExists = projectsExists[0].count > 0;
        
        if (!deviceImagesTableExists || !projectsTableExists) {
          console.log('⚠️ Migration 009 tables missing! Forcing re-execution...');
          console.log(`  - device_images: ${deviceImagesTableExists ? 'EXISTS' : 'MISSING'}`);
          console.log(`  - projects: ${projectsTableExists ? 'EXISTS' : 'MISSING'}`);
          
          // Remove from executed migrations to force re-run
          await sequelize.query(
            'DELETE FROM `SequelizeMeta` WHERE name = ?',
            { 
              replacements: [migration009File],
              type: sequelize.QueryTypes.DELETE
            }
          );
          
          pendingMigrations.push(migration009File);
          pendingMigrations.sort();
        }
      } catch (error) {
        console.log('⚠️ Could not check migration 009 table status:', error.message);
      }
    }
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations found');
      return;
    }
    
    console.log(`🔄 Found ${pendingMigrations.length} pending migration(s):`, pendingMigrations);
    
    // Run each pending migration
    for (const migrationFile of pendingMigrations) {
      try {
        console.log(`🔄 Running migration: ${migrationFile}`);
        
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migration = require(migrationPath);
        
        // Create QueryInterface-like object for Sequelize
        const queryInterface = sequelize.getQueryInterface();
        
        // Run the migration
        await migration.up(queryInterface, sequelize.Sequelize);
        
        // Mark migration as executed - use raw query with proper options
        await sequelize.query(
          'INSERT INTO `SequelizeMeta` (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name',
          { 
            replacements: [migrationFile],
            type: sequelize.QueryTypes.INSERT
          }
        );
        
        console.log(`✅ Migration ${migrationFile} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Migration ${migrationFile} failed:`, error);
        // Continue with other migrations instead of stopping
        console.log('⚠️ Continuing with remaining migrations...');
      }
    }
    
    console.log('✅ Migration check completed');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    // Don't throw error to prevent server startup failure
    console.log('⚠️ Server will continue startup despite migration errors');
  }
};

module.exports = { runMigrations };
