
const db = require('../models');

const ensurePCDeviceType = async () => {
  try {
    console.log('=== CHECKING PC DEVICE TYPE ===');
    
    // Check current ENUM values
    const [results] = await db.sequelize.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
    );
    
    const currentEnum = results[0]?.COLUMN_TYPE || '';
    console.log('Current device type ENUM:', currentEnum);
    
    // Check if PC is already there
    if (currentEnum.includes("'PC'")) {
      console.log('✅ PC already exists in device type ENUM');
      return true;
    }
    
    console.log('🔄 Adding PC to device type ENUM...');
    
    // Add PC to the ENUM
    await db.sequelize.query(
      "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL"
    );
    
    // Verify the change
    const [verifyResults] = await db.sequelize.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'devices' AND COLUMN_NAME = 'type' AND TABLE_SCHEMA = DATABASE()"
    );
    
    const updatedEnum = verifyResults[0]?.COLUMN_TYPE || '';
    console.log('Updated device type ENUM:', updatedEnum);
    
    if (updatedEnum.includes("'PC'")) {
      console.log('✅ PC successfully added to device type ENUM');
      return true;
    } else {
      console.log('❌ Failed to add PC to device type ENUM');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error ensuring PC device type:', error);
    return false;
  }
};

module.exports = { ensurePCDeviceType };
