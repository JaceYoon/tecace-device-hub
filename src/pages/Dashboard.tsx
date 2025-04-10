
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import StatusSummary from '@/components/devices/StatusSummary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PendingReportRequests from '@/components/dashboard/PendingReportRequests';
import PendingDeviceRequests from '@/components/dashboard/PendingDeviceRequests';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import DashboardFooter from '@/components/dashboard/DashboardFooter';
import { useDashboard } from '@/components/dashboard/useDashboard';

const Dashboard: React.FC = () => {
  const {
    isLoading,
    user,
    isAuthenticated,
    isAdmin,
    activeTab,
    setActiveTab,
    devices,
    users,
    pendingRequests,
    reportRequests,
    refreshTrigger,
    myDeviceFilter,
    handleRefresh,
    handleProcessRequest
  } = useDashboard();

  if (!isAuthenticated) {
    return null;
  }

  if (!user) return null;

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
        <DashboardHeader user={user} />
        
        <StatusSummary onRefresh={handleRefresh} />
        
        {/* Pass the required props to PendingReportRequests */}
        <PendingReportRequests
          reportRequests={reportRequests}
          devices={devices}
          users={users}
          handleProcessRequest={handleProcessRequest}
          isAdmin={isAdmin}
        />
        
        {/* Only show PendingDeviceRequests for admin users */}
        {isAdmin && <PendingDeviceRequests />}
        
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          myDeviceFilter={myDeviceFilter}
          userId={user.id}
          refreshTrigger={refreshTrigger}
          handleRefresh={handleRefresh}
        />
        
        <DashboardFooter isAdmin={isAdmin} />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
