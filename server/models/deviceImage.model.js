
module.exports = (sequelize, Sequelize) => {
  const DeviceImage = sequelize.define('device_image', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deviceId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'device_id',
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    imageData: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      field: 'image_data',
      comment: 'Base64 encoded image data'
    },
    uploadedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'uploaded_at'
    }
  }, {
    tableName: 'device_images',
    underscored: true,
    timestamps: false
  });
  
  return DeviceImage;
};
