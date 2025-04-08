
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import RequestTable from './RequestTable';
import { useRequestList } from './hooks/useRequestList';

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
  showExportButton
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
    user
  } = useRequestList({
    userId,
    onRequestProcessed,
    refreshTrigger
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <p>No device requests found.</p>
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
