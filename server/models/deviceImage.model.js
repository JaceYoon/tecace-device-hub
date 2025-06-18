
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
    imageUrl: {
      type: Sequelize.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    thumbnailUrl: {
      type: Sequelize.STRING(500),
      allowNull: true,
      field: 'thumbnail_url'
    },
    imageData: {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      field: 'image_data',
      comment: 'Base64 encoded image data'
    },
    fileSize: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'file_size'
    },
    mimeType: {
      type: Sequelize.STRING(100),
      allowNull: true,
      field: 'mime_type'
    },
    uploadedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'uploaded_at'
    }
  }, {
    tableName: 'device_images',
    underscored: true
  });
  
  return DeviceImage;
};
