
// Export all device-related controllers
const deviceBasicController = require('./device.basic.controller');
const deviceRequestController = require('./device.request.controller');
const deviceHistoryController = require('./device.history.controller');
const deviceImagesController = require('./device.images.controller');

// Combine all controllers into a single export
module.exports = {
  // Basic device CRUD operations
  create: deviceBasicController.create,
  findAll: deviceBasicController.findAll,
  findOne: deviceBasicController.findOne,
  update: deviceBasicController.update,
  delete: deviceBasicController.delete,
  
  // Device request operations
  requestDevice: deviceRequestController.requestDevice,
  processRequest: deviceRequestController.processRequest,
  cancelRequest: deviceRequestController.cancelRequest,
  findAllRequests: deviceRequestController.findAllRequests,
  
  // Device history operations
  getDeviceHistory: deviceHistoryController.getDeviceHistory,
  
  // Device image operations
  addDeviceImage: deviceImagesController.addDeviceImage,
  getDeviceImages: deviceImagesController.getDeviceImages,
  deleteDeviceImage: deviceImagesController.deleteDeviceImage
};
