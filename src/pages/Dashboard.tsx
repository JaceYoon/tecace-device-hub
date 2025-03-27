
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import StatusSummary from '@/components/devices/StatusSummary';
import DeviceList from '@/components/devices/DeviceList';
import RequestList from '@/components/devices/RequestList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';

const Dashboard: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  
  return (
    <PageContainer title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusSummary />
      </div>
      
      <Tabs defaultValue="devices" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="devices">Recent Devices</TabsTrigger>
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices">
          <Card className="p-4">
            <DeviceList
              limit={5}
              showAddButton={isAdmin || isManager}
              showFilterBar={false}
              showManagementLink={true}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="requests">
          <Card className="p-4">
            <RequestList
              limit={10}
              showProcessButtons={isAdmin || isManager}
              showFilterBar={false}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Dashboard;
