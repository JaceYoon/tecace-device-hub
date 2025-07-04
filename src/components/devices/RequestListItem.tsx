
import React from 'react';
import { DeviceRequest } from '@/types';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import RequestStatusBadge from '@/components/ui/RequestStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RequestListItemProps {
  request: DeviceRequest;
  getDeviceName: (request: DeviceRequest) => string;
  getUserName: (userId: string) => string;
  isAdmin: boolean;
  userId?: string;
  processing: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

const RequestListItem: React.FC<RequestListItemProps> = ({
  request,
  getDeviceName,
  getUserName,
  isAdmin,
  userId,
  processing,
  onApprove,
  onReject,
  onCancel
}) => {
  const isProcessing = processing === request.id;
  const isOwnRequest = userId && String(request.userId) === String(userId);
  
  console.log(`RequestListItem - Rendering request ${request.id}:`, {
    isAdmin,
    userId,
    requestUserId: request.userId,
    isOwnRequest,
    status: request.status,
    type: request.type,
    showCancelButton: !isAdmin && isOwnRequest && request.status === 'pending'
  });
  
  // Determine the request type badge
  const renderRequestTypeBadge = () => {
    switch(request.type) {
      case 'assign':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Rental</Badge>;
      case 'release':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Release</Badge>;
      case 'report':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Report</Badge>;
      case 'return':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Return</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <TableRow>
      <TableCell>{getDeviceName(request)}</TableCell>
      <TableCell>{getUserName(request.userId)}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <RequestStatusBadge status={request.status} />
          {renderRequestTypeBadge()}
        </div>
      </TableCell>
      <TableCell>
        {request.requestedAt && formatDistanceToNow(new Date(request.requestedAt), {
          addSuffix: true,
        })}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {isAdmin && request.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(request.id)}
                disabled={isProcessing}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
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
                disabled={isProcessing}
                className="hover:bg-red-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
            </>
          )}
          {/* Show cancel button for the user's own pending requests */}
          {request.status === 'pending' && isOwnRequest && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(request.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RequestListItem;
