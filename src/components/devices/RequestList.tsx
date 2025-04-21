
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import RequestTable from './RequestTable';
import { useRequestList } from './hooks/useRequestList';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services/data.service';
import { exportRequestsToExcel } from '@/utils/exports';
import { useAuth } from '@/components/auth/AuthProvider';

interface RequestListProps {
  title?: string;
  onRequestProcessed?: () => void;
  refreshTrigger?: number;
  userId?: string;
  showExportButton?: boolean;
  pendingOnly?: boolean;
}

const RequestList: React.FC<RequestListProps> = ({ 
  title = 'Device Requests', 
  onRequestProcessed, 
  refreshTrigger,
  userId,
  showExportButton = false,
  pendingOnly = false
}) => {
  const { isAdmin } = useAuth();

  console.log("RequestList component rendering with props:", { 
    title, 
    userId, 
    pendingOnly, 
    isAdmin: isAdmin 
  });

  // Ensure we pass the correct parameters to useRequestList
  const {
    loading,
    processing,
    requests, 
    getUserName,
    getDeviceName,
    handleApprove,
    handleReject,
    handleCancel,
    isAdmin: userIsAdmin,
    user,
    handleRefresh
  } = useRequestList({
    userId,
    onRequestProcessed,
    refreshTrigger,
    pendingOnly
  });

  // Register for global refresh events
  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(handleRefresh);
    return () => {
      if (unregister) unregister();
    };
  }, [handleRefresh]);

  const handleExport = () => {
    if (requests.length > 0) {
      exportRequestsToExcel(requests, 'device_requests.xlsx');
    }
  };

  console.log("RequestList received userId:", userId);
  console.log("RequestList: requests count:", requests.length);
  console.log("RequestList: isAdmin:", userIsAdmin);
  console.log("RequestList: current user:", user?.id, user?.name);
  console.log("RequestList: pendingOnly:", pendingOnly);
  console.log("RequestList: all requests data:", requests);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          {showExportButton && userIsAdmin && requests.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <RequestTable
            requests={requests}
            getDeviceName={getDeviceName}
            getUserName={getUserName}
            isAdmin={userIsAdmin}
            userId={user?.id}
            processing={processing}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RequestList;
