import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertTriangle, Package, RotateCcw, Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/components/auth/AuthProvider';
import { notificationService, DeviceNotification, NotificationStats } from '@/services/api/notification.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NotificationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<DeviceNotification[]>([]);
  const [allNotifications, setAllNotifications] = useState<DeviceNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('user');

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user notifications and stats
      const [userNotifs, statsData] = await Promise.all([
        notificationService.getUserNotifications(),
        notificationService.getStats()
      ]);
      
      setNotifications(userNotifs);
      setStats(statsData);

      // Load all notifications if admin
      if (isAdmin) {
        const allNotifs = await notificationService.getAllNotifications();
        setAllNotifications(allNotifs);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, type: 'device' | 'web' = 'device') => {
    try {
      await notificationService.markAsRead(id, type);
      toast.success('Marked as read');
      loadData();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async (all: boolean = false) => {
    try {
      await notificationService.markAllAsRead(all);
      toast.success('All notifications marked as read');
      loadData();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'returned':
        return <RotateCcw className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'expiring_soon':
        return 'outline';
      case 'overdue':
        return 'destructive';
      case 'returned':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const NotificationList = ({ notifications: notifs, showUserInfo = false }: { 
    notifications: DeviceNotification[], 
    showUserInfo?: boolean 
  }) => (
    <div className="space-y-4">
      {notifs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
          </CardContent>
        </Card>
      ) : (
        notifs.map((notification) => (
          <Card key={notification.id} className={notification.is_read ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getNotificationBadgeVariant(notification.type)}>
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      {!notification.is_read && (
                        <Badge variant="default">New</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{notification.message}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Device: {notification.device_name} ({notification.device_type})</p>
                      {showUserInfo && notification.user_name && (
                        <p>User: {notification.user_name} ({notification.user_email})</p>
                      )}
                      <p>Sent: {formatDate(notification.sent_at)}</p>
                    </div>
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bell className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading notifications...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your device notifications and alerts
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_notifications}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Badge variant="destructive">{stats.unread_count}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unread_count}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiring_soon}</div>
                <p className="text-xs text-muted-foreground">Within 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overdue}</div>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="user">My Notifications</TabsTrigger>
              {isAdmin && <TabsTrigger value="all">All Notifications</TabsTrigger>}
            </TabsList>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => handleMarkAllAsRead(activeTab === 'all')}
                disabled={stats?.unread_count === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button onClick={loadData} variant="outline">
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Your Notifications</span>
                </CardTitle>
                <CardDescription>
                  Device notifications related to your assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationList notifications={notifications} />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>All Notifications</span>
                  </CardTitle>
                  <CardDescription>
                    System-wide notification history and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationList notifications={allNotifications} showUserInfo={true} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default NotificationsPage;