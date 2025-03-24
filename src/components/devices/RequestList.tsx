
import React, { useState, useEffect } from 'react';
import { DeviceRequest, User, Device } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/auth/AuthProvider';
import { Clock, Package, PackageCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

interface RequestListProps {
  title?: string;
  userId?: string;
  showExportButton?: boolean;
  onRequestProcessed?: () => void;
  refreshTrigger?: number;
}

const RequestList: React.FC<RequestListProps> = ({
  title = 'Requests',
  userId,
  showExportButton = false,
  onRequestProcessed,
  refreshTrigger = 0,
}) => {
  const { isManager, user } = useAuth();
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [devices, setDevices] = useState<{[key: string]: Device}>({});
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get all requests using dataService
      const allRequests = await dataService.getRequests();
      console.log("RequestList: Fetched requests:", allRequests);

      // Filter requests if userId provided
      let filteredRequests = allRequests;
      if (userId) {
        filteredRequests = allRequests.filter(req => req.userId === userId);
      }

      setRequests(filteredRequests);

      // Create maps for faster lookup
      const deviceMap: {[key: string]: Device} = {};
      const userMap: {[key: string]: User} = {};

      // Fetch all devices and users in one batch
      const [allDevices, allUsers] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);

      // Create lookup maps
      allDevices.forEach(device => {
        deviceMap[device.id] = device;
      });

      allUsers.forEach(user => {
        userMap[user.id] = user;
      });

      setDevices(deviceMap);
      setUsers(userMap);
    } catch (error) {
      console.error('Error loading request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, refreshTrigger]);

  // Fix: Improve cancel request functionality
  const handleCancelRequest = async (requestId: string) => {
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return;
      }

      // Only the user who made the request can cancel it
      if (user && request.userId !== user.id) {
        toast.error('You can only cancel your own requests');
        return;
      }

      console.log('Cancelling request:', requestId);
      
      // Use the user's own ID as the processedBy since they're cancelling their own request
      const result = await dataService.processRequest(requestId, 'rejected', user?.id || '');
      
      if (!result) {
        toast.error('Failed to cancel request');
        return;
      }

      // Show success message
      toast.success('Request cancelled successfully');
      
      // Update local state to remove the cancelled request
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );

      // Refresh the data
      if (onRequestProcessed) onRequestProcessed();
      
      // Force reload data
      loadData();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!isManager || !user) return;

    try {
      await dataService.processRequest(requestId, approve ? 'approved' : 'rejected', user.id);
      toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);

      // Refresh the data
      if (onRequestProcessed) onRequestProcessed();
      loadData();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><PackageCheck className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><ShieldAlert className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  if (loading) {
    return (
        <div className="py-8 text-center">
          <Clock className="h-6 w-6 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading requests...</p>
        </div>
    );
  }

  if (requests.length === 0) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="mt-4 text-muted-foreground">No requests found</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-4">
          {requests.map(request => {
            const device = devices[request.deviceId];
            const user = users[request.userId];
            const processor = request.processedBy ? users[request.processedBy] : null;

            if (!device || !user) return null;

            const isPending = request.status === 'pending';
            const isMyRequest = userId === request.userId;

            return (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{device.project}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.type === 'assign' ? 'Request to assign' : 'Request to release'} 
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                        </div>
                        {request.processedAt && (
                            <div className="text-xs text-muted-foreground">
                              Processed {formatDistanceToNow(new Date(request.processedAt), { addSuffix: true })}
                              {processor && ` by ${processor.name}`}
                            </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end">
                        {getStatusBadge(request.status)}

                        {isPending && isMyRequest && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleCancelRequest(request.id)}
                            >
                              Cancel Request
                            </Button>
                        )}

                        {isPending && isManager && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessRequest(request.id, false)}
                              >
                                Reject
                              </Button>
                              <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(request.id, true)}
                              >
                                Approve
                              </Button>
                            </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>
      </div>
  );
};

export default RequestList;
