
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import RequestTable from './RequestTable';
import { useRequestList } from './hooks/useRequestList';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services/data.service';
import { exportRequestsToExcel } from '@/utils/exports';

interface RequestListProps {
  title?: string;
  onRequestProcessed?: () => void;
  refreshTrigger?: number;
  userId?: string;
  showExportButton?: boolean;
}

const RequestList: React.FC<RequestListProps> = ({ 
  title = 'Device Requests', 
  onRequestProcessed, 
  refreshTrigger,
  userId,
  showExportButton = false
}) => {
  const {
    loading,
    processing,
    filteredRequests,
    getUserName,
    getDeviceName,
    handleApprove,
    handleReject,
    handleCancel,
    isAdmin,
    user,
    handleRefresh
  } = useRequestList({
    userId,
    onRequestProcessed,
    refreshTrigger
  });

  // Register for global refresh events
  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(handleRefresh);
    return () => {
      if (unregister) unregister();
    };
  }, [handleRefresh]);

  const handleExport = () => {
    if (filteredRequests.length > 0) {
      exportRequestsToExcel(filteredRequests, 'device_requests.xlsx');
    }
  };

  console.log("RequestList received userId:", userId);
  console.log("RequestList: filtered requests count:", filteredRequests.length);
  console.log("RequestList: isAdmin:", isAdmin);
  console.log("RequestList: current user:", user?.id, user?.name);
  console.log("RequestList: all requests data:", filteredRequests);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          {showExportButton && isAdmin && filteredRequests.length > 0 && (
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
            requests={filteredRequests}
            getDeviceName={getDeviceName}
            getUserName={getUserName}
            isAdmin={isAdmin}
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
