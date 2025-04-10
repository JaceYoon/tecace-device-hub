
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceRequests } from '@/components/devices/hooks/useDeviceRequests';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RequestStatusBadge } from '@/components/ui/RequestStatusBadge';
import { Loader2, FolderInput, SmartphoneIcon } from 'lucide-react';
import { DeviceRequest } from '@/types';
import { format } from 'date-fns';

const PendingDeviceRequests: React.FC = () => {
  const navigate = useNavigate();
  const { requests, isLoading } = useDeviceRequests({ type: 'assign' });
  
  const pendingAssignRequests = requests.filter(req => 
    req.type === 'assign' && req.status === 'pending'
  );
  
  const viewAllRequests = () => {
    navigate('/device-management?tab=requests');
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <FolderInput className="h-5 w-5 mr-2 text-blue-500" />
          Pending Device Requests
        </CardTitle>
        <CardDescription>
          Review and approve device assignment requests
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingAssignRequests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <SmartphoneIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No pending device requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAssignRequests.slice(0, 5).map((request: DeviceRequest) => (
                  <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/device-management?tab=requests&id=${request.id}`)}>
                    <TableCell className="font-medium">
                      {request.requesterName || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {request.deviceName || request.deviceId || 'Unknown device'}
                    </TableCell>
                    <TableCell>
                      {request.deviceSerialNumber || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request.deviceImei || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatDate(request.requestedAt)}
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge status={request.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {pendingAssignRequests.length > 0 && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={viewAllRequests}
          >
            View all requests
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PendingDeviceRequests;
