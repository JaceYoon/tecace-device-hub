const db = require('../models');
const { Notification, WebNotification } = require('../models');

const notificationController = {
  // Get all notifications (admin only)
  async getAllNotifications(req, res) {
    try {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

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
          d.type as device_type,
          u.name as user_name,
          u.email as user_email
        FROM device_notifications dn
        LEFT JOIN devices d ON dn.device_id = d.id
        LEFT JOIN users u ON dn.user_id = u.id
        ORDER BY dn.sent_at DESC
        LIMIT 100
      `, {
        type: db.Sequelize.QueryTypes.SELECT
      });

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get user's notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;

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
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get web notifications for header badge
  async getWebNotifications(req, res) {
    try {
      const userId = req.user.id;

      const notifications = await db.sequelize.query(`
        SELECT 
          wn.id,
          wn.title,
          wn.message,
          wn.type,
          wn.is_read,
          wn.created_at,
          wn.action_url
        FROM web_notifications wn
        WHERE wn.user_id = :userId
        ORDER BY wn.created_at DESC
        LIMIT 10
      `, {
        replacements: { userId },
        type: db.Sequelize.QueryTypes.SELECT
      });

      res.json(notifications);
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

      // Update device notification
      if (req.body.type === 'device') {
        const whereClause = isAdmin ? { id } : { id, user_id: userId };
        
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
          SET is_read = true 
          WHERE id = :id AND user_id = :userId
        `, {
          replacements: { id, userId },
          type: db.Sequelize.QueryTypes.UPDATE
        });
      }

      res.json({ message: 'Notification marked as read' });
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

      if (isAdmin && req.query.all === 'true') {
        // Admin can mark all notifications as read
        await db.sequelize.query(`
          UPDATE device_notifications SET is_read = true WHERE is_read = false
        `);
        await db.sequelize.query(`
          UPDATE web_notifications SET is_read = true WHERE is_read = false
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
          UPDATE web_notifications SET is_read = true WHERE user_id = :userId AND is_read = false
        `, {
          replacements: { userId },
          type: db.Sequelize.QueryTypes.UPDATE
        });
      }

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      if (isAdmin) {
        const stats = await db.sequelize.query(`
          SELECT 
            COUNT(*) as total_notifications,
            SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count,
            SUM(CASE WHEN type = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
            SUM(CASE WHEN type = 'overdue' THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN type = 'returned' THEN 1 ELSE 0 END) as returned
          FROM device_notifications
          WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, {
          type: db.Sequelize.QueryTypes.SELECT
        });

        res.json(stats[0]);
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
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = notificationController;