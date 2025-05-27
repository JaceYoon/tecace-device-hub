
const db = require('../models');

const ensurePCDeviceType = async () => {
  try {
    console.log('=== CHECKING PC DEVICE TYPE ===');
    
    // Use Sequelize's queryInterface to modify the ENUM safely
    const queryInterface = db.sequelize.getQueryInterface();
    
    // Check if PC already exists by trying to create a test record
    try {
      const testDevice = await db.device.build({
        project: 'TEST_PROJECT',
        projectGroup: 'TEST_GROUP', 
        type: 'PC',
        deviceType: 'C-Type'
      });
      
      // Validate the model - this will throw if PC is not a valid type
      await testDevice.validate();
      console.log('✅ PC already exists in device type ENUM');
      return true;
      
    } catch (validationError) {
      if (validationError.message && validationError.message.includes('type must be one of')) {
        console.log('🔄 PC not found in ENUM, adding it...');
        
        // Use ALTER TABLE with proper MariaDB syntax
        await queryInterface.changeColumn('devices', 'type', {
          type: db.Sequelize.ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other'),
          allowNull: false
        });
        
        console.log('✅ PC successfully added to device type ENUM');
        return true;
      } else {
        throw validationError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error ensuring PC device type:', error);
    console.error('❌ Error message:', error.message);
    
    // Fallback: Try direct ALTER TABLE if Sequelize methods fail
    try {
      console.log('🔄 Trying direct ALTER TABLE approach...');
      await db.sequelize.query(
        "ALTER TABLE devices MODIFY COLUMN type ENUM('Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other') NOT NULL",
        { type: db.Sequelize.QueryTypes.RAW }
      );
      console.log('✅ PC added via direct ALTER TABLE');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      return false;
    }
  }
};

module.exports = { ensurePCDeviceType };
