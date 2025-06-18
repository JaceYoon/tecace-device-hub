

const db = require("../../models");
const DeviceImage = db.deviceImage;
const Device = db.device;

// 디바이스에 이미지 추가
exports.addDeviceImage = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { imageData } = req.body;

    console.log('=== ADD IMAGE DEBUG ===');
    console.log('DeviceId from params:', deviceId);
    console.log('Has imageData:', !!imageData);
    console.log('ImageData length:', imageData ? imageData.length : 0);

    // 디바이스 존재 확인
    const device = await Device.findByPk(deviceId);
    if (!device) {
      console.log('Device not found:', deviceId);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('Device found:', device.id);

    // 새 이미지 생성
    const deviceImage = await DeviceImage.create({
      deviceId: parseInt(deviceId),
      imageData
    });

    console.log('Image created in device_images table:', deviceImage.id);

    res.status(201).json({
      message: "Image uploaded successfully",
      image: deviceImage
    });

  } catch (error) {
    console.error("Error adding device image:", error);
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
    console.log('DeviceId from params:', deviceId);

    const images = await DeviceImage.findAll({
      where: { deviceId: parseInt(deviceId) },
      order: [['uploadedAt', 'DESC']]
    });

    console.log('Found images count:', images.length);

    res.json(images);

  } catch (error) {
    console.error("Error fetching device images:", error);
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
    const deviceIdInt = parseInt(deviceId);

    console.log('=== DELETE IMAGE DEBUG START ===');
    console.log('DeviceId from params (string):', deviceId);
    console.log('DeviceId parsed (int):', deviceIdInt);
    console.log('DeviceId is valid number:', !isNaN(deviceIdInt));

    // 1. devices 테이블에서 devicePicture를 null로 업데이트
    const device = await Device.findByPk(deviceIdInt);
    if (!device) {
      console.log('Device not found for ID:', deviceIdInt);
      return res.status(404).json({ message: "Device not found" });
    }

    console.log('Device found:', device.id);
    console.log('Current devicePicture:', device.devicePicture ? 'HAS_VALUE' : 'NULL');

    const updateResult = await device.update({ devicePicture: null });
    console.log('Device update completed, new devicePicture:', updateResult.devicePicture);

    // 2. device_images 테이블에서 모든 이미지 레코드 삭제
    const deletedCount = await DeviceImage.destroy({
      where: { deviceId: deviceIdInt }
    });

    console.log(`device_images에서 ${deletedCount}개 레코드 삭제 완료`);
    console.log('=== DELETE IMAGE DEBUG END ===');

    res.json({ 
      message: "All device images deleted successfully",
      deletedFromDevices: true,
      deletedFromDeviceImages: deletedCount,
      deviceId: deviceIdInt
    });

  } catch (error) {
    console.error("Error deleting device images:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error deleting device images",
      error: error.message 
    });
  }
};
