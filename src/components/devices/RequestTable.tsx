
import React from 'react';
import { DeviceRequest } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import RequestListItem from './RequestListItem';

interface RequestTableProps {
  requests: DeviceRequest[];
  getDeviceName: (request: DeviceRequest) => string;
  getUserName: (userId: string) => string;
  isAdmin: boolean;
  userId?: string;
  processing: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  getDeviceName,
  getUserName,
  isAdmin,
  userId,
  processing,
  onApprove,
  onReject,
  onCancel
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <RequestListItem
              key={request.id}
              request={request}
              getDeviceName={getDeviceName}
              getUserName={getUserName}
              isAdmin={isAdmin}
              userId={userId}
              processing={processing}
              onApprove={onApprove}
              onReject={onReject}
              onCancel={onCancel}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestTable;
