
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import DeviceList from '@/components/devices/DeviceList';
import RequestList from '@/components/devices/RequestList';
import StatusSummary from '@/components/devices/StatusSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataStore } from '@/utils/data';
import { DeviceRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  ArrowRight, Clock, Database, Loader2, PackageCheck, 
  Shield, Smartphone, Package, ListFilter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch requests
  useEffect(() => {
    if (user) {
      try {
        setIsLoading(true);
        const allRequests = dataStore.getRequests() || [];
        setRequests(allRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
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
  
  const handlePopulateTestData = () => {
    try {
      const success = dataStore.populateTestData();
      if (success) {
        toast.success('Test data generated successfully', {
          description: '30 random devices and 5 users added to the system'
        });
      } else {
        toast.info('Database already has sufficient test data');
      }
      handleRefresh();
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error('Failed to generate test data');
    }
  };
  
  if (!user) return null;
  
  // Safe filter for pending requests
  const pendingRequests = requests.filter(request => request.status === 'pending') || [];
  
  // Get my devices
  const myDeviceFilter = user.id;
  
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
          
          {isAdmin && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handlePopulateTestData}
            >
              <Database className="h-4 w-4" />
              Generate Test Data
            </Button>
          )}
        </div>
        
        {/* Status Summary */}
        <StatusSummary onRefresh={handleRefresh} />
        
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
          <TabsList className={`grid ${isManager ? 'grid-cols-4' : 'grid-cols-4'} w-full max-w-md mb-8`}>
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
          
          <TabsContent value="requests" className="animate-slide-up">
            <RequestList 
              title="My Requests" 
              userId={user.id}
              showExportButton={false}
              onRequestProcessed={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="all-devices" className="animate-slide-up">
            <DeviceList 
              title="All Devices"
              filterByStatus={isManager ? ['available', 'assigned', 'missing', 'stolen'] : ['available', 'assigned']} 
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
