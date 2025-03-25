
import React, { useState, useEffect } from 'react';
import { dataService } from '@/services/data.service';
import { DeviceRequest, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import RequestStatusBadge from '@/components/ui/RequestStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Check, X, RefreshCw } from 'lucide-react';

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
  userId
}) => {
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsData, usersData] = await Promise.all([
        dataService.getRequests(),
        dataService.getUsers()
      ]);
      setRequests(requestsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load device requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await dataService.processRequest(requestId, 'approved', '');
      toast.success('Request approved successfully');
      fetchData();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await dataService.processRequest(requestId, 'rejected', '');
      toast.success('Request rejected successfully');
      fetchData();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Filter requests based on userId prop if provided
  let filteredRequests = requests;
  if (userId) {
    filteredRequests = requests.filter(request => request.userId === userId);
  } else {
    filteredRequests = requests.filter(request => request.status === 'pending');
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <p>No pending device requests.</p>
        ) : (
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
                {filteredRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell>{request.device?.project || 'N/A'}</TableCell>
                    <TableCell>{getUserName(request.userId)}</TableCell>
                    <TableCell>
                      <RequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(request.requestedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? (
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
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? (
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestList;
