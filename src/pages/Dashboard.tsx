
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import StatusSummary from '@/components/devices/StatusSummary';
import DeviceList from '@/components/devices/DeviceList';
import RequestList from '@/components/devices/RequestList';
import { useAuth } from '@/components/auth/AuthProvider';

const Dashboard = () => {
  const { isAuthenticated, isAdmin, isManager } = useAuth();

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusSummary />
        </div>
        
        {/* Notice: No Refresh button here */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Recently Added Devices</h2>
          <DeviceList 
            limit={5}
            showAddButton={false}
            showFilterBar={false}
            showManagementLink={true}
          />
        </div>
        
        {(isAdmin || isManager) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Pending Requests</h2>
            <RequestList 
              limit={5}
              showProcessButtons={true}
              showFilterBar={false}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
