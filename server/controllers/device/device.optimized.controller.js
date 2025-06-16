
const db = require('../../models');
const Device = db.device;
const User = db.user;
const Request = db.request;
const Op = db.Sequelize.Op;

// Get paginated devices with server-side filtering and sorting
exports.getPagedDevices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      type,
      assignedToUser,
      sortBy,
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Cap at 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    let whereConditions = {};
    let includeConditions = [];

    // Search across multiple fields
    if (search) {
      whereConditions[Op.or] = [
        { project: { [Op.like]: `%${search}%` } },
        { projectGroup: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { imei: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
        { memo: { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    // Type filter
    if (type && type !== 'all') {
      whereConditions.type = type;
    }

    // Assigned user filter
    if (assignedToUser) {
      whereConditions.assignedToId = assignedToUser;
    }

    // Role-based filtering (non-admin users can't see missing/stolen devices)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      whereConditions.status = {
        [Op.and]: [
          whereConditions.status || { [Op.ne]: null },
          { [Op.notIn]: ['missing', 'stolen'] }
        ]
      };
    }

    // Include relationships
    const includeOptions = [
      { 
        model: User, 
        as: 'assignedTo', 
        attributes: ['id', 'name', 'email'],
        required: false
      },
      { 
        model: User, 
        as: 'addedBy', 
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ];

    // Add search in user name if searching
    if (search) {
      includeOptions[0].where = {
        name: { [Op.like]: `%${search}%` }
      };
      includeOptions[0].required = false;
    }

    // Build order clause
    let orderClause = [];
    if (sortBy && sortBy !== 'none') {
      switch (sortBy) {
        case 'currentName':
          orderClause = [[{ model: User, as: 'assignedTo' }, 'name', sortOrder.toUpperCase()]];
          break;
        case 'deviceName':
          orderClause = [['project', sortOrder.toUpperCase()]];
          break;
        case 'receivedDate':
          orderClause = [['receivedDate', sortOrder.toUpperCase()]];
          break;
        default:
          orderClause = [['createdAt', 'DESC']];
      }
    } else {
      orderClause = [['createdAt', 'DESC']];
    }

    // Execute query with count
    const { count, rows } = await Device.findAndCountAll({
      where: whereConditions,
      include: includeOptions,
      limit: limitNum,
      offset: offset,
      order: orderClause,
      distinct: true // Important for accurate count with joins
    });

    // Get pending requests for these devices
    const deviceIds = rows.map(device => device.id);
    const pendingRequests = await Request.findAll({
      where: { 
        deviceId: { [Op.in]: deviceIds },
        status: 'pending'
      }
    });

    // Process devices with request info
    const devicesWithRequestInfo = rows.map(device => {
      const deviceJson = device.toJSON();
      
      // Ensure IDs are strings
      if (deviceJson.id !== undefined) deviceJson.id = String(deviceJson.id);
      if (deviceJson.assignedToId !== undefined) deviceJson.assignedToId = String(deviceJson.assignedToId);
      if (deviceJson.addedById !== undefined) deviceJson.addedById = String(deviceJson.addedById);
      
      // Add assignedToName
      if (deviceJson.assignedTo) {
        deviceJson.assignedToName = deviceJson.assignedTo.name;
        deviceJson.assignedTo = String(deviceJson.assignedTo.id);
      }
      
      // Check for pending requests
      const pendingRequest = pendingRequests.find(req => String(req.deviceId) === String(deviceJson.id));
      if (pendingRequest) {
        deviceJson.requestedBy = String(pendingRequest.userId);
      }
      
      return deviceJson;
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    console.log(`Paginated query: page ${pageNum}, limit ${limitNum}, total ${count}, returned ${rows.length} devices`);

    res.json({
      data: devicesWithRequestInfo,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNext,
        hasPrev
      }
    });

  } catch (err) {
    console.error("Error in getPagedDevices:", err);
    res.status(500).json({ message: err.message });
  }
};

// Fast search endpoint for autocomplete/typeahead
exports.searchDevices = async (req, res) => {
  try {
    const { search, limit = 20, status, type } = req.query;

    if (!search || search.length < 2) {
      return res.json([]);
    }

    let whereConditions = {
      [Op.or]: [
        { project: { [Op.like]: `%${search}%` } },
        { projectGroup: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { imei: { [Op.like]: `%${search}%` } }
      ]
    };

    // Add filters
    if (status && status !== 'all') {
      whereConditions.status = status;
    }
    if (type && type !== 'all') {
      whereConditions.type = type;
    }

    // Role-based filtering
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      whereConditions.status = {
        [Op.and]: [
          whereConditions.status || { [Op.ne]: null },
          { [Op.notIn]: ['missing', 'stolen'] }
        ]
      };
    }

    const devices = await Device.findAll({
      where: whereConditions,
      attributes: ['id', 'project', 'type', 'status', 'assignedToId'],
      include: [
        { 
          model: User, 
          as: 'assignedTo', 
          attributes: ['id', 'name'],
          required: false
        }
      ],
      limit: parseInt(limit),
      order: [['project', 'ASC']]
    });

    const processedDevices = devices.map(device => {
      const deviceJson = device.toJSON();
      if (deviceJson.assignedTo) {
        deviceJson.assignedToName = deviceJson.assignedTo.name;
        deviceJson.assignedTo = String(deviceJson.assignedTo.id);
      }
      return deviceJson;
    });

    res.json(processedDevices);

  } catch (err) {
    console.error("Error in searchDevices:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get device statistics for dashboard
exports.getDeviceStats = async (req, res) => {
  try {
    // Role-based query conditions
    let whereConditions = {};
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      whereConditions.status = { [Op.notIn]: ['missing', 'stolen'] };
    }

    // Get counts by status
    const statusCounts = await Device.findAll({
      where: whereConditions,
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get counts by type
    const typeCounts = await Device.findAll({
      where: whereConditions,
      attributes: [
        'type',
        [db.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // Process results
    const stats = {
      total: 0,
      available: 0,
      assigned: 0,
      missing: 0,
      stolen: 0,
      dead: 0,
      byType: {}
    };

    statusCounts.forEach(item => {
      const status = item.status;
      const count = parseInt(item.count);
      stats.total += count;
      if (stats.hasOwnProperty(status)) {
        stats[status] = count;
      }
    });

    typeCounts.forEach(item => {
      stats.byType[item.type] = parseInt(item.count);
    });

    res.json(stats);

  } catch (err) {
    console.error("Error in getDeviceStats:", err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk update devices (for admin operations)
exports.bulkUpdateDevices = async (req, res) => {
  try {
    const { deviceIds, updates } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'Device IDs array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'Updates object is required' });
    }

    // Validate permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Insufficient permissions for bulk operations' });
    }

    const result = await Device.update(updates, {
      where: {
        id: { [Op.in]: deviceIds }
      }
    });

    console.log(`Bulk updated ${result[0]} devices`);

    res.json({
      success: true,
      updated: result[0]
    });

  } catch (err) {
    console.error("Error in bulkUpdateDevices:", err);
    res.status(500).json({ message: err.message });
  }
};
