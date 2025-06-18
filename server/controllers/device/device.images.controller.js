
const db = require("../../models");
const DeviceImage = db.deviceImage;
const Device = db.device;

// 디바이스에 이미지 추가
exports.addDeviceImage = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { imageData } = req.body;

    console.log('=== ADD IMAGE DEBUG ===');
    console.log('DeviceId from params (raw):', deviceId);
    console.log('DeviceId type:', typeof deviceId);
    
    // deviceId를 정수로 변환하고 유효성 검사
    const deviceIdInt = parseInt(deviceId, 10);
    console.log('DeviceId parsed to int:', deviceIdInt);
    console.log('Is valid number:', !isNaN(deviceIdInt));
    
    if (isNaN(deviceIdInt)) {
      console.log('❌ Invalid deviceId - not a number');
      return res.status(400).json({ message: "Invalid device ID" });
    }

    console.log('Has imageData:', !!imageData);
    console.log('ImageData length:', imageData ? imageData.length : 0);

    // 디바이스 존재 확인 (정수 ID로)
    const device = await Device.findByPk(deviceIdInt);
    if (!device) {
      console.log('❌ Device not found for ID:', deviceIdInt);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('✅ Device found:', device.id, 'Type:', typeof device.id);

    // 새 이미지 생성 (deviceId를 정수로 저장)
    const deviceImage = await DeviceImage.create({
      deviceId: deviceIdInt,  // 정수로 저장
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

// 디바이스의 모든 이미지 조회
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
      where: { deviceId: deviceIdInt },  // 정수로 검색
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

// 디바이스의 모든 이미지 삭제 (완전 제거)
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

    // 1. devices 테이블에서 devicePicture를 null로 업데이트
    const device = await Device.findByPk(deviceIdInt);
    if (!device) {
      console.log('❌ Device not found for ID:', deviceIdInt);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('✅ Device found:', device.id, 'Type:', typeof device.id);
    console.log('Current devicePicture exists:', !!device.devicePicture);

    // devicePicture를 null로 업데이트
    const updateResult = await device.update({ devicePicture: null });
    console.log('✅ Device devicePicture updated to null:', updateResult.devicePicture === null);

    // 2. device_images 테이블에서 해당 디바이스의 모든 이미지 레코드 삭제
    console.log('Searching for images with deviceId:', deviceIdInt);
    
    // 먼저 삭제할 이미지들을 조회해보자
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
