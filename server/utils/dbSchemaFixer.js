
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

module.exports = { ensurePCDeviceType };
