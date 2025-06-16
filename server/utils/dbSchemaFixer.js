
const db = require('../models');

const ensurePCDeviceType = async () => {
  try {
    console.log('=== CHECKING PC DEVICE TYPE ===');
    
    // Check the ACTUAL database schema, not the Sequelize model
    const [results] = await db.sequelize.query(
      "SHOW COLUMNS FROM devices WHERE Field = 'type'",
      { type: db.Sequelize.QueryTypes.SELECT }
    );
    
    const columnType = results[0]?.Type || '';
    console.log('Actual database ENUM for type column:', columnType);
    
    // Check if PC is in the actual database ENUM
    if (columnType.includes("'PC'")) {
      console.log('✅ PC already exists in database ENUM');
      return true;
    }
    
    console.log('🔄 PC not found in database ENUM, adding it now...');
    
    // Add PC to the database ENUM
    await db.sequelize.query(
      "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
    );
    
    // Verify it was added
    const [verifyResults] = await db.sequelize.query(
      "SHOW COLUMNS FROM devices WHERE Field = 'type'",
      { type: db.Sequelize.QueryTypes.SELECT }
    );
    
    const updatedColumnType = verifyResults[0]?.Type || '';
    console.log('Updated database ENUM:', updatedColumnType);
    
    // Only show error if PC is still not there after the ALTER command
    if (updatedColumnType.includes("'PC'")) {
      console.log('✅ PC successfully added to database ENUM');
      return true;
    } else {
      // This is a real error - the ALTER command ran but PC wasn't added
      console.log('❌ Failed to add PC - please check database permissions');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error ensuring PC device type:', error);
    console.error('❌ Error message:', error.message);
    return false;
  }
};

const ensureMemoField = async () => {
  try {
    console.log('=== CHECKING MEMO FIELD ===');
    
    // Check if memo column exists in the devices table
    const [results] = await db.sequelize.query(
      "SHOW COLUMNS FROM devices WHERE Field = 'memo'",
      { type: db.Sequelize.QueryTypes.SELECT }
    );
    
    if (results && results.length > 0) {
      console.log('✅ Memo field already exists in devices table');
      return true;
    }
    
    console.log('🔄 Memo field not found, adding it now...');
    
    try {
      // Add memo column to the devices table
      await db.sequelize.query(
        "ALTER TABLE devices ADD COLUMN memo TEXT NULL COMMENT 'Memo field for additional device information'"
      );
      
      console.log('✅ Memo field successfully added to devices table');
      return true;
    } catch (addError) {
      // Check if the error is due to duplicate column (column already exists)
      if (addError.original && addError.original.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Memo field already exists (detected during add attempt)');
        return true;
      } else {
        // This is a different error, re-throw it
        throw addError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error ensuring memo field:', error);
    console.error('❌ Error message:', error.message);
    return false;
  }
};

module.exports = { ensurePCDeviceType, ensureMemoField };
