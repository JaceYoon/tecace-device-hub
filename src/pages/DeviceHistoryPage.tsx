
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import { dataService } from '@/services/data.service';
import { Device, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface HistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string;
  releasedAt: string | null;
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

const DeviceHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => dataService.devices.getAll(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => dataService.users.getAll(),
  });

  useEffect(() => {
    const fetchAllHistory = async () => {
      if (devices.length === 0) return;
      
      const historyPromises = devices.map(async (device) => {
        try {
          const history = await dataService.getDeviceHistory(device.id);
          return history || [];
        } catch (error) {
          console.error(`Error fetching history for device ${device.id}:`, error);
          return [];
        }
      });

      const allHistoryArrays = await Promise.all(historyPromises);
      const flatHistory = allHistoryArrays.flat();
      setAllHistory(flatHistory);
    };

    if (!devicesLoading && devices.length > 0) {
      fetchAllHistory();
    }
  }, [devices, devicesLoading]);

  const filteredHistory = allHistory.filter((entry) => {
    const matchesSearch = 
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devices.find(d => d.id === entry.deviceId)?.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devices.find(d => d.id === entry.deviceId)?.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && !entry.releasedAt) ||
      (statusFilter === 'returned' && entry.releasedAt);

    return matchesSearch && matchesStatus;
  });

  const getDeviceInfo = (deviceId: string) => {
    return devices.find(d => d.id === deviceId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isLoading = devicesLoading || usersLoading;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device History</h1>
            <p className="text-muted-foreground">
              View complete ownership history for all devices
            </p>
          </div>
          <History className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ownership History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user, device, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="active">Currently Assigned</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No history records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory
                      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                      .map((entry) => {
                        const device = getDeviceInfo(entry.deviceId);
                        const isActive = !entry.releasedAt;
                        
                        const calculateDuration = () => {
                          const start = new Date(entry.assignedAt);
                          const end = entry.releasedAt ? new Date(entry.releasedAt) : new Date();
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 30) {
                            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                          } else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30);
                            return `${months} month${months !== 1 ? 's' : ''}`;
                          } else {
                            const years = Math.floor(diffDays / 365);
                            const remainingMonths = Math.floor((diffDays % 365) / 30);
                            return `${years}y ${remainingMonths}m`;
                          }
                        };

                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{device?.project || 'Unknown Device'}</div>
                                <div className="text-sm text-muted-foreground">
                                  S/N: {device?.serialNumber || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{entry.userName}</div>
                            </TableCell>
                            <TableCell>{formatDate(entry.assignedAt)}</TableCell>
                            <TableCell>{formatDate(entry.releasedAt)}</TableCell>
                            <TableCell>
                              <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? "Active" : "Returned"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{calculateDuration()}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DeviceHistoryPage;
