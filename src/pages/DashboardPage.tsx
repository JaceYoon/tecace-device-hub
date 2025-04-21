
import React from 'react';
import { useDashboard } from '@/components/dashboard/useDashboard';
import PageContainer from '@/components/layout/PageContainer';
import RecentDevices from '@/components/dashboard/RecentDevices';
import PendingDeviceRequests from '@/components/dashboard/PendingDeviceRequests';
import DeviceReports from '@/components/dashboard/DeviceReports';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DeviceStatus from '@/components/dashboard/DeviceStatus';
import UserActivity from '@/components/dashboard/UserActivity';
import RequestList from '@/components/devices/RequestList';
import DeviceReturnReminder from '@/components/dashboard/DeviceReturnReminder';

const DashboardPage = () => {
  const {
    isLoading,
    user,
    isAdmin,
    activeTab,
    refreshTrigger,
    handleRefresh,
    myDeviceFilter,
    devices
  } = useDashboard();

  return (
    <PageContainer className="py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Display return reminder if user is logged in */}
        {user && (
          <DeviceReturnReminder 
            devices={Object.values(devices)} 
            userId={user.id} 
          />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DashboardStats />
        <DeviceStatus />
        {isAdmin && <UserActivity />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <RecentDevices />
        {isAdmin ? (
          <PendingDeviceRequests />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <RequestList 
              title="My Pending Requests"
              showExportButton={false}
              userId={user?.id}
              refreshTrigger={refreshTrigger}
              onRequestProcessed={handleRefresh}
            />
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <DeviceReports />
        </div>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
