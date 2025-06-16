
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('=== MIGRATION 006: Adding History Tracking Tables ===');
      
      // Check if device_history table already exists
      const [historyTableExists] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_history'",
        { type: QueryTypes.SELECT, transaction }
      );
      
      if (historyTableExists.count > 0) {
        console.log('✅ History tracking tables already exist, skipping migration');
        await transaction.commit();
        return;
      }
      
      console.log('🔄 Creating device_history table...');
      
      // Create device_history table
      await queryInterface.createTable('device_history', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        device_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        action_type: {
          type: Sequelize.ENUM('assigned', 'released', 'created', 'updated', 'deleted', 'reported_missing', 'reported_stolen', 'reported_dead', 'returned'),
          allowNull: false
        },
        previous_status: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        new_status: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        previous_assigned_to: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        new_assigned_to: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        performed_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        additional_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });
      
      console.log('🔄 Creating user_activity_logs table...');
      
      // Create user_activity_logs table
      await queryInterface.createTable('user_activity_logs', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        activity_type: {
          type: Sequelize.ENUM('login', 'logout', 'device_request', 'device_release', 'profile_update', 'password_change'),
          allowNull: false
        },
        device_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'devices',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        ip_address: {
          type: Sequelize.INET,
          allowNull: true
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        additional_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });
      
      console.log('🔄 Creating analytics_summary table...');
      
      // Create analytics_summary table
      await queryInterface.createTable('analytics_summary', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        date_period: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        period_type: {
          type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
          allowNull: false
        },
        total_devices: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        devices_assigned: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        devices_available: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        devices_missing: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        devices_stolen: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        total_users: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        active_users: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        total_requests: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        approved_requests: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        rejected_requests: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });
      
      console.log('🔄 Adding unique constraint to analytics_summary...');
      
      // Add unique constraint
      await queryInterface.addConstraint('analytics_summary', {
        fields: ['date_period', 'period_type'],
        type: 'unique',
        name: 'unique_date_period_type',
        transaction
      });
      
      console.log('🔄 Creating indexes for better performance...');
      
      // Create indexes for device_history
      await queryInterface.addIndex('device_history', ['device_id'], {
        name: 'idx_device_history_device_id',
        transaction
      });
      
      await queryInterface.addIndex('device_history', ['user_id'], {
        name: 'idx_device_history_user_id',
        transaction
      });
      
      await queryInterface.addIndex('device_history', ['action_type'], {
        name: 'idx_device_history_action_type',
        transaction
      });
      
      await queryInterface.addIndex('device_history', ['created_at'], {
        name: 'idx_device_history_created_at',
        transaction
      });
      
      // Create indexes for user_activity_logs
      await queryInterface.addIndex('user_activity_logs', ['user_id'], {
        name: 'idx_user_activity_logs_user_id',
        transaction
      });
      
      await queryInterface.addIndex('user_activity_logs', ['activity_type'], {
        name: 'idx_user_activity_logs_activity_type',
        transaction
      });
      
      await queryInterface.addIndex('user_activity_logs', ['created_at'], {
        name: 'idx_user_activity_logs_created_at',
        transaction
      });
      
      // Create indexes for analytics_summary
      await queryInterface.addIndex('analytics_summary', ['date_period'], {
        name: 'idx_analytics_summary_date_period',
        transaction
      });
      
      await queryInterface.addIndex('analytics_summary', ['period_type'], {
        name: 'idx_analytics_summary_period_type',
        transaction
      });
      
      console.log('✅ History tracking tables created successfully');
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating history tracking tables:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('=== ROLLING BACK MIGRATION 006: Removing History Tracking Tables ===');
      
      // Drop tables in reverse order (due to foreign key constraints)
      await queryInterface.dropTable('analytics_summary', { transaction });
      await queryInterface.dropTable('user_activity_logs', { transaction });
      await queryInterface.dropTable('device_history', { transaction });
      
      console.log('✅ History tracking tables removed successfully');
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing history tracking tables:', error);
      throw error;
    }
  }
};
