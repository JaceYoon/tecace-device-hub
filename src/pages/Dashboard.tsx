import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import DeviceList from '@/components/devices/DeviceList';
import RequestList from '@/components/devices/RequestList';
import StatusSummary from '@/components/devices/StatusSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataService } from '@/services/data.service';
import { DeviceRequest, Device, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowRight, Clock, Loader2, PackageCheck,
  Shield, Package, ListFilter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [devices, setDevices] = useState<{[key: string]: Device}>({});
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      setRequests([]);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allRequests = await dataService.getRequests();
        console.log("Dashboard: Fetched requests:", allRequests);
        setRequests(allRequests);
        
        const allDevices = await dataService.getDevices();
        const allUsers = await dataService.getUsers();
        
        console.log("Dashboard: User id:", user.id, "Name:", user.name);
        console.log("Dashboard: Fetched devices:", allDevices.length);
        
        const myDevices = allDevices.filter(d => {
          return String(d.assignedTo) === String(user.id) || String(d.assignedToId) === String(user.id);
        });
        console.log("Dashboard: My devices found:", myDevices.length);
        console.log("Dashboard: My devices details:", myDevices);
        
        const deviceMap: {[key: string]: Device} = {};
        const userMap: {[key: string]: User} = {};
        
        allDevices.forEach(device => {
          deviceMap[device.id] = device;
        });
        
        allUsers.forEach(user => {
          userMap[user.id] = user;
        });
        
        setDevices(deviceMap);
        setUsers(userMap);
      } catch (error) {
        console.error('Error fetching requests:', error);
        if (!(error instanceof Error && error.message.includes('Unauthorized'))) {
          toast.error('Failed to load requests');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, refreshTrigger, isAuthenticated]);

  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    
    return () => {
      if (unregister) unregister();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!isManager || !user) return;

    try {
      await dataService.processRequest(
          requestId,
          approve ? 'approved' : 'rejected'
      );

      toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);
      handleRefresh();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!user) return null;

  const pendingRequests = requests.filter(request => request.status === 'pending') || [];

  const myDeviceFilter = String(user.id);
  console.log("Dashboard: Setting my device filter to:", myDeviceFilter);

  if (isLoading) {
    return (
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-lg text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        </PageContainer>
    );
  }

  return (
      <PageContainer>
        <div className="flex flex-col space-y-8 pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Device Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Clock className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <StatusSummary onRefresh={handleRefresh} />

          {isManager && pendingRequests.length > 0 && (
              <div className="rounded-lg border p-4 animate-slide-up">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Requests
                  <Badge variant="outline" className="ml-2 bg-accent/20">
                    {pendingRequests.length}
                  </Badge>
                </h2>

                <div className="space-y-4">
                  {pendingRequests.map(request => {
                    const device = devices[request.deviceId];
                    const requestUser = users[request.userId];
                    
                    const deviceName = device ? (device.project || device.projectGroup || 'Unknown Device') : 'Unknown Device';
                    const userName = requestUser ? requestUser.name || 'Unknown User' : 'Unknown User';
                    const serialNumber = device ? device.serialNumber : 'N/A';
                    
                    return (
                        <div
                            key={request.id}
                            className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">{deviceName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.type === 'assign' ? 'Assignment' : 'Release'} request from {userName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Serial: {serialNumber}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessRequest(request.id, false)}
                            >
                              Reject
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleProcessRequest(request.id, true)}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          )}

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-md mb-8">
              <TabsTrigger value="available" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Available
              </TabsTrigger>
              <TabsTrigger value="my-devices" className="flex items-center gap-1">
                <PackageCheck className="h-4 w-4" />
                My Devices
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Requests
              </TabsTrigger>
              <TabsTrigger value="all-devices" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                All Devices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="animate-slide-up">
              <DeviceList
                  title="Available Devices"
                  filterByAvailable={true}
                  showExportButton={false}
                  refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            <TabsContent value="my-devices" className="animate-slide-up">
              <DeviceList
                  title="My Devices"
                  filterByAssignedToUser={myDeviceFilter}
                  showControls={false}
                  showExportButton={false}
                  refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            <TabsContent value="requests" className="animate-slide-up">
              <RequestList
                  title="My Requests"
                  userId={user.id}
                  showExportButton={false}
                  onRequestProcessed={handleRefresh}
                  refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            <TabsContent value="all-devices" className="animate-slide-up">
              <DeviceList
                  title="All Devices"
                  filterByStatus={isManager ? undefined : ['available', 'assigned']}
                  showExportButton={true}
                  refreshTrigger={refreshTrigger}
              />
            </TabsContent>
          </Tabs>

          {isManager && (
              <div className="flex justify-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/device-management')}
                    className="flex items-center gap-2"
                >
                  Go to Device Management
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
          )}
        </div>
      </PageContainer>
  );
};

export default Dashboard;
