
const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;

// Get device ownership history
exports.getDeviceHistory = async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Verify the device exists
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Get ownership history from the Requests table
    const history = await Request.findAll({
      where: { 
        deviceId,
        type: ['assign', 'release'],
        status: ['approved', 'returned'] // Include both approved and returned requests
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'processedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['processedAt', 'DESC']]
    });
    
    // Transform request data to match ownership history format
    const historyWithNames = history.map(entry => {
      const entryJson = entry.toJSON();
      
      // Create a formatted history entry from request data
      const historyEntry = {
        id: String(entryJson.id),
        deviceId: String(entryJson.deviceId),
        userId: String(entryJson.userId),
        userName: entryJson.user ? entryJson.user.name : 'Unknown User',
        // For an assign request, this is when it was assigned
        assignedAt: entryJson.type === 'assign' ? entryJson.processedAt : null,
        // For a release request, this is when it was released
        releasedAt: entryJson.type === 'release' ? entryJson.processedAt : null,
        releasedById: entryJson.type === 'release' ? String(entryJson.processedById) : null,
        releasedByName: entryJson.type === 'release' && entryJson.processedBy ? entryJson.processedBy.name : null,
        releaseReason: entryJson.type === 'release' ? entryJson.reason || 'User requested release' : null
      };
      
      return historyEntry;
    });
    
    // Add current assignment if not already in the history
    if (device.assignedToId) {
      // Find the user who currently has the device
      const assignedUser = await User.findByPk(device.assignedToId);
      
      // Check if there's already an entry for the current assignment
      const hasCurrentAssignment = historyWithNames.some(
        entry => entry.userId === String(device.assignedToId) && !entry.releasedAt
      );
      
      if (assignedUser && !hasCurrentAssignment) {
        // Add the current assignment to the history
        historyWithNames.unshift({
          id: `current-${deviceId}`,
          deviceId: String(deviceId),
          userId: String(device.assignedToId),
          userName: assignedUser.name,
          assignedAt: device.updatedAt,
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
          releaseReason: null
        });
      }
    }
    
    console.log(`Returning ${historyWithNames.length} history entries for device ${deviceId}`);
    res.json(historyWithNames);
  } catch (err) {
    console.error("Error fetching device history:", err);
    res.status(500).json({ message: err.message });
  }
};
