
import React from 'react';
import { DeviceRequest } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RequestTableProps {
  requests: DeviceRequest[];
  getDeviceName: (request: DeviceRequest) => string;
  getUserName: (request: DeviceRequest) => string;
  isAdmin: boolean;
  userId?: string;
  processing: Set<string>;
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
  // Get request type display text
  const getRequestTypeText = (request: DeviceRequest) => {
    switch (request.type) {
      case 'assign': return 'Device Rental';
      case 'release': return 'Release Device';
      case 'report': return `Report: ${request.reportType || 'Issue'}`;
      case 'return': return 'Return to Warehouse';
      default: return request.type;
    }
  };
  
  // Get the badge color based on request type
  const getTypeColor = (request: DeviceRequest) => {
    switch (request.type) {
      case 'assign': return 'bg-blue-500 hover:bg-blue-600';
      case 'release': return 'bg-amber-500 hover:bg-amber-600';
      case 'report': return 'bg-red-500 hover:bg-red-600';
      case 'return': return 'bg-violet-500 hover:bg-violet-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  // Get the status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'approved': return 'bg-green-500 hover:bg-green-600';
      case 'rejected': return 'bg-red-500 hover:bg-red-600';
      case 'cancelled': return 'bg-slate-500 hover:bg-slate-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  // Check if the user can cancel this request (they created it and it's still pending)
  const canCancel = (request: DeviceRequest) => {
    // Convert both to strings for comparison
    const requestUserId = String(request.userId);
    const currentUserId = userId ? String(userId) : '';
    
    console.log(`Can cancel check - request userId: ${requestUserId}, current userId: ${currentUserId}, pending: ${request.status === 'pending'}`);
    
    return request.status === 'pending' && 
           requestUserId === currentUserId &&
           !processing.has(request.id);
  };

  console.log("RequestTable received requests:", requests);
  console.log("Current userId:", userId, typeof userId);
  console.log("Is admin:", isAdmin);
  
  if (requests.length > 0) {
    console.log("Sample first request userId:", requests[0].userId, typeof requests[0].userId);
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Device</TableHead>
            <TableHead>Request Type</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{getDeviceName(request)}</TableCell>
                <TableCell>
                  <Badge className={`${getTypeColor(request)} text-white`}>
                    {getRequestTypeText(request)}
                  </Badge>
                </TableCell>
                <TableCell>{getUserName(request)}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(request.status)} text-white`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.requestedAt ? (
                    formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })
                  ) : (
                    'Unknown'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isAdmin && request.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => onApprove(request.id)}
                          disabled={processing.has(request.id)}
                        >
                          {processing.has(request.id) ? (
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onReject(request.id)}
                          disabled={processing.has(request.id)}
                        >
                          {processing.has(request.id) ? (
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    
                    {/* Allow users to cancel their own requests */}
                    {canCancel(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancel(request.id)}
                        disabled={processing.has(request.id)}
                        title="Cancel Request"
                      >
                        {processing.has(request.id) ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No requests found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestTable;
