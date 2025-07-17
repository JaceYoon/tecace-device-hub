const db = require('../models');

const notificationController = {
  // Get all notifications (admin only)
  async getAllNotifications(req, res) {
    try {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // For admin, show expiring and overdue devices instead of notifications
      console.log('Getting admin device overview...');
      
      try {
        const expiringDevices = await db.sequelize.query(`
          SELECT 
            d.id,
            d.name as device_name,
            d.type as device_type,
            d.expiration_date,
            d.assignedTo as user_id,
            u.name as user_name,
            u.email as user_email,
            CASE 
              WHEN d.expiration_date < NOW() THEN 'overdue'
              WHEN d.expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'expiring_soon'
              ELSE 'ok'
            END as status,
            DATEDIFF(d.expiration_date, NOW()) as days_until_expiry
          FROM devices d
          LEFT JOIN users u ON d.assignedTo = u.id
          WHERE d.status = 'assigned' 
          AND d.expiration_date IS NOT NULL
          AND (d.expiration_date < NOW() OR d.expiration_date <= DATE_ADD(NOW(), INTERVAL 7 DAY))
          ORDER BY d.expiration_date ASC
        `, {
          type: db.Sequelize.QueryTypes.SELECT
        });

        // Format as notification-like objects for UI compatibility
        const notifications = expiringDevices.map(device => ({
          id: `device-${device.id}`,
          device_id: device.id,
          user_id: device.user_id,
          type: device.status,
          message: device.status === 'overdue' 
            ? `Device "${device.device_name}" is overdue for return (expired: ${new Date(device.expiration_date).toLocaleDateString()})`
            : `Device "${device.device_name}" is expiring soon (${new Date(device.expiration_date).toLocaleDateString()}) and needs to be returned`,
          sent_at: new Date().toISOString(),
          is_read: true, // Admin overview doesn't need read status
          device_name: device.device_name,
          device_type: device.device_type,
          user_name: device.user_name,
          user_email: device.user_email,
          expiration_date: device.expiration_date,
          days_until_expiry: device.days_until_expiry
        }));

        res.json(notifications);
      } catch (tableError) {
        console.log('Device tables not ready yet, returning empty array');
        res.json([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get user's notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      console.log('Getting user notifications for:', userId);

      try {
        const notifications = await db.sequelize.query(`
          SELECT 
            dn.id,
            dn.device_id,
            dn.user_id,
            dn.type,
            dn.message,
            dn.sent_at,
            dn.is_read,
            d.name as device_name,
            d.type as device_type
          FROM device_notifications dn
          LEFT JOIN devices d ON dn.device_id = d.id
          WHERE dn.user_id = :userId
          ORDER BY dn.sent_at DESC
          LIMIT 50
        `, {
          replacements: { userId },
          type: db.Sequelize.QueryTypes.SELECT
        });

        res.json(notifications);
      } catch (tableError) {
        console.log('Notification tables not ready yet, returning empty array');
        res.json([]);
      }
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get web notifications for header badge
  async getWebNotifications(req, res) {
    try {
      const userId = req.user.id;

      try {
        const notifications = await db.sequelize.query(`
          SELECT 
            wn.id,
            wn.title,
            wn.message,
            wn.type,
            wn.read_status as is_read,
            wn.created_at
          FROM web_notifications wn
          WHERE wn.user_id = :userId
          ORDER BY wn.created_at DESC
          LIMIT 10
        `, {
          replacements: { userId },
          type: db.Sequelize.QueryTypes.SELECT
        });

        res.json(notifications);
      } catch (tableError) {
        console.log('Web notification tables not ready yet, returning empty array');
        res.json([]);
      }
    } catch (error) {
      console.error('Error fetching web notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      try {
        // Update device notification
        if (req.body.type === 'device') {
          await db.sequelize.query(`
            UPDATE device_notifications 
            SET is_read = true 
            WHERE id = :id ${!isAdmin ? 'AND user_id = :userId' : ''}
          `, {
            replacements: { id, userId },
            type: db.Sequelize.QueryTypes.UPDATE
          });
        } else {
          // Update web notification
          await db.sequelize.query(`
            UPDATE web_notifications 
            SET read_status = true 
            WHERE id = :id AND user_id = :userId
          `, {
            replacements: { id, userId },
            type: db.Sequelize.QueryTypes.UPDATE
          });
        }

        res.json({ message: 'Notification marked as read' });
      } catch (tableError) {
        console.log('Notification tables not ready yet');
        res.json({ message: 'Notification marked as read' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      try {
        if (isAdmin && req.query.all === 'true') {
          // Admin can mark all notifications as read
          await db.sequelize.query(`
            UPDATE device_notifications SET is_read = true WHERE is_read = false
          `);
          await db.sequelize.query(`
            UPDATE web_notifications SET read_status = true WHERE read_status = false
          `);
        } else {
          // Mark user's notifications as read
          await db.sequelize.query(`
            UPDATE device_notifications SET is_read = true WHERE user_id = :userId AND is_read = false
          `, {
            replacements: { userId },
            type: db.Sequelize.QueryTypes.UPDATE
          });
          
          await db.sequelize.query(`
            UPDATE web_notifications SET read_status = true WHERE user_id = :userId AND read_status = false
          `, {
            replacements: { userId },
            type: db.Sequelize.QueryTypes.UPDATE
          });
        }

        res.json({ message: 'All notifications marked as read' });
      } catch (tableError) {
        console.log('Notification tables not ready yet');
        res.json({ message: 'All notifications marked as read' });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Send return request for device (admin only)
  async sendReturnRequest(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { deviceId, message: customMessage } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: 'Device ID is required' });
      }

      // Get device and user info
      const device = await db.sequelize.query(`
        SELECT d.*, u.id as assigned_user_id, u.name as assigned_user_name, u.email as user_email
        FROM devices d 
        LEFT JOIN users u ON d.assignedToId = u.id 
        WHERE d.id = :deviceId AND d.status = 'assigned'
      `, {
        replacements: { deviceId },
        type: db.Sequelize.QueryTypes.SELECT
      });

      if (!device || device.length === 0) {
        return res.status(404).json({ message: 'Device not found or not assigned' });
      }

      const deviceInfo = device[0];

      if (!deviceInfo.assigned_user_id) {
        return res.status(400).json({ message: 'Device is not assigned to any user' });
      }

      // Create return request message
      const message = customMessage || `Please return device "${deviceInfo.name}" at your earliest convenience. Contact admin if you have any questions.`;

      try {
        // Create notification for the user
        await db.sequelize.query(`
          INSERT INTO device_notifications (device_id, user_id, type, message, sent_at, is_read, created_at, updated_at)
          VALUES (:deviceId, :userId, 'return_request', :message, NOW(), false, NOW(), NOW())
        `, {
          replacements: {
            deviceId,
            userId: deviceInfo.assigned_user_id,
            message
          },
          type: db.Sequelize.QueryTypes.INSERT
        });

        // Create web notification for real-time display
        await db.sequelize.query(`
          INSERT INTO web_notifications (user_id, title, message, type, read_status, created_at, updated_at)
          VALUES (:userId, :title, :message, 'return_request', false, NOW(), NOW())
        `, {
          replacements: {
            userId: deviceInfo.assigned_user_id,
            title: 'Device Return Request',
            message: `Return request for device "${deviceInfo.name}"`
          },
          type: db.Sequelize.QueryTypes.INSERT
        });

        // TODO: Send email notification (will implement later)
        console.log(`Return request sent for device ${deviceInfo.name} to user ${deviceInfo.assigned_user_name} (${deviceInfo.user_email})`);

        res.json({
          message: 'Return request sent successfully',
          details: {
            deviceId,
            deviceName: deviceInfo.name,
            userId: deviceInfo.assigned_user_id,
            userName: deviceInfo.assigned_user_name,
            userEmail: deviceInfo.user_email
          }
        });
      } catch (tableError) {
        console.error('Notification table not ready:', tableError);
        res.status(500).json({ message: 'Notification tables not ready. Please run migrations first.' });
      }
    } catch (error) {
      console.error('Error sending return request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      try {
        if (isAdmin) {
          // For admin, show device expiration stats instead of personal notifications
          const deviceStats = await db.sequelize.query(`
            SELECT 
              COUNT(CASE WHEN d.status = 'assigned' AND d.expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 END) as expiring_soon,
              COUNT(CASE WHEN d.status = 'assigned' AND d.expiration_date < NOW() THEN 1 END) as overdue,
              COUNT(CASE WHEN d.status = 'assigned' AND d.expiration_date IS NOT NULL THEN 1 END) as total_assigned,
              COUNT(CASE WHEN dn.type = 'returned' AND dn.sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as returned
            FROM devices d
            LEFT JOIN device_notifications dn ON d.id = dn.device_id
          `, {
            type: db.Sequelize.QueryTypes.SELECT
          });

          const stats = deviceStats[0];
          res.json({
            total_notifications: parseInt(stats.expiring_soon) + parseInt(stats.overdue),
            unread_count: parseInt(stats.expiring_soon) + parseInt(stats.overdue),
            expiring_soon: parseInt(stats.expiring_soon),
            overdue: parseInt(stats.overdue),
            returned: parseInt(stats.returned),
            total_assigned: parseInt(stats.total_assigned)
          });
        } else {
          const stats = await db.sequelize.query(`
            SELECT 
              COUNT(*) as total_notifications,
              SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count,
              SUM(CASE WHEN type = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
              SUM(CASE WHEN type = 'overdue' THEN 1 ELSE 0 END) as overdue
            FROM device_notifications
            WHERE user_id = :userId AND sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          `, {
            replacements: { userId },
            type: db.Sequelize.QueryTypes.SELECT
          });

          res.json(stats[0]);
        }
      } catch (tableError) {
        console.log('Notification tables not ready yet, returning default stats');
        res.json({
          total_notifications: 0,
          unread_count: 0,
          expiring_soon: 0,
          overdue: 0,
          returned: 0
        });
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // DEV MODE ONLY: Create test notification for device expiration
  async createTestNotification(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development' && process.env.FORCE_DEV_MODE !== 'true') {
        return res.status(403).json({ message: 'Test endpoints only available in development mode' });
      }

      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { deviceId, type = 'expiring_soon' } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: 'Device ID is required' });
      }

      // Get device info
      const device = await db.sequelize.query(`
        SELECT d.*, u.id as assigned_user_id, u.name as assigned_user_name 
        FROM devices d 
        LEFT JOIN users u ON d.assignedTo = u.id 
        WHERE d.id = :deviceId
      `, {
        replacements: { deviceId },
        type: db.Sequelize.QueryTypes.SELECT
      });

      if (!device || device.length === 0) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const deviceInfo = device[0];

      // Create notification message
      let message;
      switch (type) {
        case 'expiring_soon':
          message = `Device "${deviceInfo.name}" is expiring soon and needs to be returned`;
          break;
        case 'overdue':
          message = `Device "${deviceInfo.name}" is overdue for return`;
          break;
        case 'returned':
          message = `Device "${deviceInfo.name}" has been returned successfully`;
          break;
        default:
          message = `Notification for device "${deviceInfo.name}"`;
      }

      // Insert test notification
      try {
        await db.sequelize.query(`
          INSERT INTO device_notifications (device_id, user_id, type, message, sent_at, is_read)
          VALUES (:deviceId, :userId, :type, :message, NOW(), false)
        `, {
          replacements: {
            deviceId,
            userId: deviceInfo.assigned_user_id || req.user.id,
            type,
            message
          },
          type: db.Sequelize.QueryTypes.INSERT
        });

        res.json({ 
          message: 'Test notification created successfully',
          notification: {
            deviceId,
            type,
            message,
            userId: deviceInfo.assigned_user_id || req.user.id
          }
        });
      } catch (tableError) {
        console.error('Notification table not ready:', tableError);
        res.status(500).json({ message: 'Notification tables not ready. Please run migrations first.' });
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // DEV MODE ONLY: Check devices and create expiration notifications
  async checkExpiringDevices(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development' && process.env.FORCE_DEV_MODE !== 'true') {
        return res.status(403).json({ message: 'Test endpoints only available in development mode' });
      }

      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      try {
        // Find devices expiring soon (within 7 days)
        const expiringSoon = await db.sequelize.query(`
          SELECT d.*, u.id as assigned_user_id, u.name as assigned_user_name 
          FROM devices d 
          LEFT JOIN users u ON d.assignedTo = u.id 
          WHERE d.status = 'assigned' 
          AND d.expiration_date IS NOT NULL 
          AND d.expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        `, {
          type: db.Sequelize.QueryTypes.SELECT
        });

        // Find overdue devices
        const overdue = await db.sequelize.query(`
          SELECT d.*, u.id as assigned_user_id, u.name as assigned_user_name 
          FROM devices d 
          LEFT JOIN users u ON d.assignedTo = u.id 
          WHERE d.status = 'assigned' 
          AND d.expiration_date IS NOT NULL 
          AND d.expiration_date < NOW()
        `, {
          type: db.Sequelize.QueryTypes.SELECT
        });

        const notifications = [];

        // Create notifications for expiring devices
        for (const device of expiringSoon) {
          // Check if notification already exists
          const existing = await db.sequelize.query(`
            SELECT id FROM device_notifications 
            WHERE device_id = :deviceId AND type = 'expiring_soon' AND sent_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          `, {
            replacements: { deviceId: device.id },
            type: db.Sequelize.QueryTypes.SELECT
          });

          if (existing.length === 0) {
            const message = `Device "${device.name}" is expiring soon (${new Date(device.expiration_date).toLocaleDateString()}) and needs to be returned`;
            
            await db.sequelize.query(`
              INSERT INTO device_notifications (device_id, user_id, type, message, sent_at, is_read)
              VALUES (:deviceId, :userId, 'expiring_soon', :message, NOW(), false)
            `, {
              replacements: {
                deviceId: device.id,
                userId: device.assigned_user_id,
                message
              },
              type: db.Sequelize.QueryTypes.INSERT
            });

            notifications.push({ type: 'expiring_soon', device: device.name });
          }
        }

        // Create notifications for overdue devices
        for (const device of overdue) {
          // Check if notification already exists
          const existing = await db.sequelize.query(`
            SELECT id FROM device_notifications 
            WHERE device_id = :deviceId AND type = 'overdue' AND sent_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          `, {
            replacements: { deviceId: device.id },
            type: db.Sequelize.QueryTypes.SELECT
          });

          if (existing.length === 0) {
            const message = `Device "${device.name}" is overdue for return (expired: ${new Date(device.expiration_date).toLocaleDateString()})`;
            
            await db.sequelize.query(`
              INSERT INTO device_notifications (device_id, user_id, type, message, sent_at, is_read)
              VALUES (:deviceId, :userId, 'overdue', :message, NOW(), false)
            `, {
              replacements: {
                deviceId: device.id,
                userId: device.assigned_user_id,
                message
              },
              type: db.Sequelize.QueryTypes.INSERT
            });

            notifications.push({ type: 'overdue', device: device.name });
          }
        }

        res.json({
          message: 'Device expiration check completed',
          summary: {
            expiringSoon: expiringSoon.length,
            overdue: overdue.length,
            notificationsCreated: notifications.length
          },
          notifications
        });
      } catch (tableError) {
        console.error('Notification table not ready:', tableError);
        res.status(500).json({ message: 'Notification tables not ready. Please run migrations first.' });
      }
    } catch (error) {
      console.error('Error checking expiring devices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = notificationController;