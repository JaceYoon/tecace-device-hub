
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import DeviceList from '@/components/devices/DeviceList';
import DeviceForm from '@/components/devices/DeviceForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Loader2, Package, PlusCircle, Shield, Smartphone } from 'lucide-react';

const DeviceManagement: React.FC = () => {
  const { user, isAuthenticated, isManager } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all-devices');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (!isManager) {
      navigate('/dashboard');
      toast.error('Access denied. Manager permissions required.');
    }
    
    setIsLoading(false);
  }, [isAuthenticated, isManager, navigate]);
  
  const handleDeviceAdded = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
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
  
  if (!isManager) return null;
  
  return (
    <PageContainer>
      <div className="flex flex-col space-y-8 pt-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Device Management</h1>
            <p className="text-muted-foreground">
              Manage all devices in your organization
            </p>
          </div>
          
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
        
        {/* Add Device Form */}
        {showAddForm && (
          <div className="animate-slide-up">
            <DeviceForm 
              onDeviceAdded={handleDeviceAdded} 
              onCancel={() => setShowAddForm(false)} 
            />
          </div>
        )}
        
        {/* Device Tabs */}
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="all-devices" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Assigned
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Special
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-devices" className="animate-slide-up">
            <DeviceList 
              title="All Devices" 
            />
          </TabsContent>
          
          <TabsContent value="assigned" className="animate-slide-up">
            <DeviceList 
              title="Assigned Devices" 
              filterByStatus={['assigned']}
            />
          </TabsContent>
          
          <TabsContent value="special" className="animate-slide-up">
            <DeviceList 
              title="Missing & Stolen Devices" 
              filterByStatus={['missing', 'stolen']}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DeviceManagement;
