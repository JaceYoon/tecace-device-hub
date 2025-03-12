
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import DeviceList from '@/components/devices/DeviceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataStore } from '@/utils/mockData';
import { DeviceRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, Clock, PackageCheck, Shield, Smartphone, Package } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isManager } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch requests
  useEffect(() => {
    if (user) {
      const allRequests = dataStore.getRequests();
      setRequests(allRequests);
    }
  }, [user, refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Process request (manager only)
  const handleProcessRequest = (requestId: string, approve: boolean) => {
    if (!isManager || !user) return;
    
    try {
      dataStore.processRequest(
        requestId, 
        approve ? 'approved' : 'rejected', 
        user.id
      );
      
      toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);
      handleRefresh();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };
  
  if (!user) return null;
  
  // Filter pending requests
  const pendingRequests = requests.filter(request => request.status === 'pending');
  
  // Get my devices
  const myDeviceFilter = user.id;
  
  return (
    <PageContainer>
      <div className="flex flex-col space-y-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Device Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}
          </p>
        </div>
        
        {/* Manager: Pending Requests Section */}
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
                const device = dataStore.getDeviceById(request.deviceId);
                const requestUser = dataStore.getUserById(request.userId);
                
                if (!device || !requestUser) return null;
                
                return (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.type === 'assign' ? 'Assignment' : 'Release'} request from {requestUser.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Serial: {device.serialNumber}
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
        
        {/* Device Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="available" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Available
            </TabsTrigger>
            <TabsTrigger value="my-devices" className="flex items-center gap-1">
              <PackageCheck className="h-4 w-4" />
              My Devices
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
            />
          </TabsContent>
          
          <TabsContent value="my-devices" className="animate-slide-up">
            <DeviceList 
              title="My Devices" 
              filterByAssignedToUser={myDeviceFilter}
              showControls={false}
              showExportButton={false}
            />
          </TabsContent>

          <TabsContent value="all-devices" className="animate-slide-up">
            <DeviceList 
              title="All Devices"
              filterByStatus={['available', 'assigned']} 
              showExportButton={true}
            />
          </TabsContent>
        </Tabs>
        
        {isManager && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/manage')}
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
