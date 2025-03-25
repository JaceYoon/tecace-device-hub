
import React, { useState, useEffect } from 'react';
import { DeviceRequest, User, Device, RequestStatus } from '@/types';
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
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled([
        dataService.getRequests(),
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      // Handle requests result
      let allRequests: DeviceRequest[] = [];
      if (results[0].status === 'fulfilled') {
        console.log("RequestList: Fetched requests:", results[0].value);
        allRequests = results[0].value;
      } else {
        console.error('Error fetching requests:', results[0].reason);
        setError(`Failed to load requests: ${results[0].reason?.message || 'Unknown error'}`);
        allRequests = [];
      }

      let filteredRequests = allRequests;
      if (userId) {
        filteredRequests = allRequests.filter(req => req.userId === userId);
      }

      setRequests(filteredRequests);

      // Handle devices result
      const deviceMap: {[key: string]: Device} = {};
      if (results[1].status === 'fulfilled') {
        const allDevices = results[1].value;
        allDevices.forEach(device => {
          deviceMap[device.id] = device;
        });
      } else {
        console.error('Error fetching devices:', results[1].reason);
      }
      
      // Handle users result
      const userMap: {[key: string]: User} = {};
      if (results[2].status === 'fulfilled') {
        const allUsers = results[2].value;
        allUsers.forEach(user => {
          userMap[user.id] = user;
        });
      } else {
        console.error('Error fetching users:', results[2].reason);
      }
      
      setDevices(deviceMap);
      setUsers(userMap);
      
    } catch (error) {
      console.error('Error loading request data:', error);
      setError((error as Error).message || 'An unknown error occurred');
      toast.error('Failed to load request data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, refreshTrigger]);

  const handleCancelRequest = async (requestId: string) => {
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return;
      }

      if (user && request.userId !== user.id) {
        toast.error('You can only cancel your own requests');
        return;
      }

      console.log('Cancelling request:', requestId);
      
      const result = await dataService.cancelRequest(requestId, user?.id || '');
      
      if (!result) {
        toast.error('Failed to cancel request');
        return;
      }

      toast.success('Request cancelled successfully');
      
      // The result has a status of 'cancelled' which is now a valid RequestStatus
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'cancelled' as RequestStatus } : req
        )
      );

      if (onRequestProcessed) onRequestProcessed();
      
      setTimeout(() => {
        loadData();
      }, 500);
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

      if (onRequestProcessed) onRequestProcessed();
      
      setTimeout(() => {
        loadData();
      }, 500);
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
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><AlertTriangle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateValue: Date | string | undefined) => {
    if (!dateValue) return 'Unknown';
    
    // Handle string dates
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Validate the date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue);
      return 'Invalid date';
    }
    
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Date error';
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 px-6 bg-red-50 text-red-700 rounded border border-red-200">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
            const requestUser = users[request.userId];
            const processor = request.processedBy ? users[request.processedBy] : null;

            // Get device name with fallback (prefer project, then projectGroup, then fallback)
            const deviceName = device ? (device.project || device.projectGroup || 'Unknown Device') : 'Unknown Device';
            const userName = requestUser ? requestUser.name || 'Unknown User' : 'Unknown User';
            const serialNumber = device ? device.serialNumber || 'N/A' : 'N/A';

            const isPending = request.status === 'pending';
            const isMyRequest = userId === request.userId;

            return (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{deviceName}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.type === 'assign' ? 'Request to assign' : 'Request to release'} 
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Requested by {userName} {formatDate(request.requestedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Serial: {serialNumber}
                        </div>
                        {request.processedAt && (
                            <div className="text-xs text-muted-foreground">
                              Processed {formatDate(request.processedAt)}
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
