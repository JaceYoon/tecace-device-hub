
const db = require("../../models");
const DeviceImage = db.deviceImage;
const Device = db.device;

// 디바이스에 이미지 추가
exports.addDeviceImage = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { imageData, mimeType, fileSize } = req.body;

    // 디바이스 존재 확인
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // 새 이미지 생성
    const deviceImage = await DeviceImage.create({
      deviceId: parseInt(deviceId),
      imageData,
      mimeType,
      fileSize,
      uploadedAt: new Date()
    });

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

    const images = await DeviceImage.findAll({
      where: { deviceId: parseInt(deviceId) },
      order: [['uploadedAt', 'DESC']]
    });

    res.json(images);

  } catch (error) {
    console.error("Error fetching device images:", error);
    res.status(500).json({ 
      message: "Error fetching device images",
      error: error.message 
    });
  }
};

// 특정 이미지 삭제
exports.deleteDeviceImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await DeviceImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    await image.destroy();

    res.json({ message: "Image deleted successfully" });

  } catch (error) {
    console.error("Error deleting device image:", error);
    res.status(500).json({ 
      message: "Error deleting device image",
      error: error.message 
    });
  }
};
