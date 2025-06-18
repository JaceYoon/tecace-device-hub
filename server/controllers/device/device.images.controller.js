
const db = require("../../models");
const DeviceImage = db.deviceImage;
const Device = db.device;

// Add image to device
exports.addDeviceImage = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { imageData } = req.body;

    console.log('=== ADD IMAGE DEBUG ===');
    console.log('DeviceId from params (raw):', deviceId);
    console.log('DeviceId type:', typeof deviceId);
    
    // Parse deviceId to integer and validate
    const deviceIdInt = parseInt(deviceId, 10);
    console.log('DeviceId parsed to int:', deviceIdInt);
    console.log('Is valid number:', !isNaN(deviceIdInt));
    
    if (isNaN(deviceIdInt)) {
      console.log('❌ Invalid deviceId - not a number');
      return res.status(400).json({ message: "Invalid device ID" });
    }

    console.log('Has imageData:', !!imageData);
    console.log('ImageData length:', imageData ? imageData.length : 0);

    // Check if device exists (using integer ID)
    const device = await Device.findByPk(deviceIdInt);
    if (!device) {
      console.log('❌ Device not found for ID:', deviceIdInt);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('✅ Device found:', device.id, 'Type:', typeof device.id);

    // Create new image (store deviceId as integer)
    const deviceImage = await DeviceImage.create({
      deviceId: deviceIdInt,  // Store as integer
      imageData
    });

    console.log('✅ Image created in device_images table:', deviceImage.id);
    console.log('Stored deviceId:', deviceImage.deviceId, 'Type:', typeof deviceImage.deviceId);

    res.status(201).json({
      message: "Image uploaded successfully",
      image: deviceImage
    });

  } catch (error) {
    console.error("❌ Error adding device image:", error);
    res.status(500).json({ 
      message: "Error adding device image",
      error: error.message 
    });
  }
};

// Get all images for a device
exports.getDeviceImages = async (req, res) => {
  try {
    const { deviceId } = req.params;

    console.log('=== GET IMAGES DEBUG ===');
    console.log('DeviceId from params (raw):', deviceId);
    console.log('DeviceId type:', typeof deviceId);
    
    const deviceIdInt = parseInt(deviceId, 10);
    console.log('DeviceId parsed to int:', deviceIdInt);
    
    if (isNaN(deviceIdInt)) {
      console.log('❌ Invalid deviceId - not a number');
      return res.status(400).json({ message: "Invalid device ID" });
    }

    const images = await DeviceImage.findAll({
      where: { deviceId: deviceIdInt },  // Search with integer
      order: [['uploadedAt', 'DESC']]
    });

    console.log('Found images count:', images.length);
    if (images.length > 0) {
      console.log('First image deviceId:', images[0].deviceId, 'Type:', typeof images[0].deviceId);
    }

    res.json(images);

  } catch (error) {
    console.error("❌ Error fetching device images:", error);
    res.status(500).json({ 
      message: "Error fetching device images",
      error: error.message 
    });
  }
};

// Delete all images for a device (complete removal)
exports.deleteDeviceImage = async (req, res) => {
  try {
    const { deviceId } = req.params;

    console.log('=== DELETE IMAGE DEBUG START ===');
    console.log('DeviceId from params (raw):', deviceId);
    console.log('DeviceId type:', typeof deviceId);
    
    const deviceIdInt = parseInt(deviceId, 10);
    console.log('DeviceId parsed to int:', deviceIdInt);
    console.log('Is valid number:', !isNaN(deviceIdInt));

    if (isNaN(deviceIdInt)) {
      console.log('❌ Invalid deviceId - not a number');
      return res.status(400).json({ message: "Invalid device ID" });
    }

    // 1. Update devicePicture to null in devices table
    const device = await Device.findByPk(deviceIdInt);
    if (!device) {
      console.log('❌ Device not found for ID:', deviceIdInt);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('✅ Device found:', device.id, 'Type:', typeof device.id);
    console.log('Current devicePicture exists:', !!device.devicePicture);

    // Update devicePicture to null
    const updateResult = await device.update({ devicePicture: null });
    console.log('✅ Device devicePicture updated to null:', updateResult.devicePicture === null);

    // 2. Delete all image records for this device from device_images table
    console.log('Searching for images with deviceId:', deviceIdInt);
    
    // First find images to delete
    const imagesToDelete = await DeviceImage.findAll({
      where: { deviceId: deviceIdInt }
    });
    
    console.log('Found images to delete:', imagesToDelete.length);
    imagesToDelete.forEach((img, index) => {
      console.log(`Image ${index + 1}: id=${img.id}, deviceId=${img.deviceId} (type: ${typeof img.deviceId})`);
    });

    const deletedCount = await DeviceImage.destroy({
      where: { deviceId: deviceIdInt }
    });

    console.log(`✅ Deleted ${deletedCount} records from device_images table`);
    console.log('=== DELETE IMAGE DEBUG END ===');

    res.json({ 
      message: "All device images deleted successfully",
      deletedFromDevices: true,
      deletedFromDeviceImages: deletedCount,
      deviceId: deviceIdInt
    });

  } catch (error) {
    console.error("❌ Error deleting device images:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error deleting device images",
      error: error.message 
    });
  }
};
