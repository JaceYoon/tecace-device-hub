
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import DeviceList from '@/components/devices/DeviceList';
import DeviceForm from '@/components/devices/DeviceForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Package, PlusCircle, Shield, Smartphone, FileSpreadsheet, Clock } from 'lucide-react';
import RequestList from '@/components/devices/RequestList';
import { dataService } from '@/services/data.service';
import StatusSummary from '@/components/devices/StatusSummary';
import { exportDevicesToExcel } from '@/utils/exportUtils';

const DeviceManagement: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'all-devices');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    // Only admin can access this page
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('Only administrators can access this page');
      return;
    }

    // Set active tab based on URL parameter
    if (tabParam && ['all-devices', 'assigned', 'pending', 'special'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    setIsLoading(false);
  }, [isAuthenticated, isAdmin, navigate, tabParam]);

  const handleDeviceAdded = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Device added and database updated successfully');
  };

  const handleRequestProcessed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with the tab parameter
    navigate(`/device-management?tab=${value}`);
  };

  const handleExportAll = async () => {
    try {
      const devices = await dataService.getDevices();
      exportDevicesToExcel(devices, 'Complete_Device_Inventory.xlsx');
      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export devices');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </PageContainer>
    );
  }

  // If user is not authorized, return null (redirection happens in useEffect)
  if (!isAdmin) return null;

  return (
    <PageContainer>
      <div className="flex flex-col space-y-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Device Management</h1>
            <p className="text-muted-foreground">
              Manage all devices in your organization
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleExportAll}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              {showAddForm ? (
                <>Cancel</>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Add Device
                </>
              )}
            </Button>
          </div>
        </div>

        <StatusSummary onRefresh={handleRefresh} />

        {showAddForm && (
          <div className="mb-8">
            <DeviceForm
              onDeviceAdded={handleDeviceAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-md mb-8">
            <TabsTrigger value="all-devices" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Assigned
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Special
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-devices" className="animate-slide-up">
            <DeviceList
              title="All Devices"
              showExportButton={false}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          <TabsContent value="assigned" className="animate-slide-up">
            <DeviceList
              title="Assigned Devices"
              filterByStatus={['assigned']}
              showExportButton={false}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          <TabsContent value="pending" className="animate-slide-up">
            <div className="space-y-8">
              <DeviceList
                title="Devices with Pending Requests"
                statusFilter="pending"
                showExportButton={false}
                refreshTrigger={refreshTrigger}
              />

              <RequestList
                title="Pending Device Requests"
                onRequestProcessed={handleRequestProcessed}
                refreshTrigger={refreshTrigger}
                pendingOnly={true} // Set to true to show only pending requests
              />
            </div>
          </TabsContent>

          <TabsContent value="special" className="animate-slide-up">
            <DeviceList
              title="Missing & Stolen Devices"
              filterByStatus={['missing', 'stolen']}
              showExportButton={false}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DeviceManagement;
