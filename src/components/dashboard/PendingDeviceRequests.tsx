
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import RequestStatusBadge from '@/components/ui/RequestStatusBadge';
import { Loader2, FolderInput, SmartphoneIcon } from 'lucide-react';
import { DeviceRequest } from '@/types';
import { format } from 'date-fns';
import { dataService } from '@/services/data.service';
import { useState, useEffect } from 'react';

const PendingDeviceRequests: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<DeviceRequest[]>([]);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const allRequests = await dataService.devices.getAllRequests();
        const filteredRequests = allRequests.filter(req => 
          req.type === 'assign' && req.status === 'pending'
        );
        setPendingRequests(filteredRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
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
        ) : pendingRequests.length === 0 ? (
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
                {pendingRequests.slice(0, 5).map((request: DeviceRequest) => (
                  <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/device-management?tab=requests&id=${request.id}`)}>
                    <TableCell className="font-medium">
                      {request.user?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {request.device?.project || request.deviceName || request.deviceId || 'Unknown device'}
                    </TableCell>
                    <TableCell>
                      {request.device?.serialNumber || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request.device?.imei || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatDate(request.requestedAt.toString())}
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
      
      {pendingRequests.length > 0 && (
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
