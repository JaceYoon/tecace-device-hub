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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, History, Monitor, User as UserIcon } from 'lucide-react';
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
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
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

  const calculateDuration = (assignedAt: string, releasedAt: string | null) => {
    const start = new Date(assignedAt);
    const end = releasedAt ? new Date(releasedAt) : new Date();
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

  // Filter history for device view
  const filteredDeviceHistory = allHistory.filter((entry) => {
    const device = getDeviceInfo(entry.deviceId);
    const matchesSearch = 
      entry.userName.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
      device?.project?.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
      device?.serialNumber?.toLowerCase().includes(deviceSearchTerm.toLowerCase());

    const matchesStatus = 
      deviceStatusFilter === 'all' ||
      (deviceStatusFilter === 'active' && !entry.releasedAt) ||
      (deviceStatusFilter === 'returned' && entry.releasedAt);

    return matchesSearch && matchesStatus;
  });

  // Group history by user for user view
  const userHistoryMap = new Map<string, {
    user: User;
    currentDevices: HistoryEntry[];
    previousDevices: HistoryEntry[];
  }>();

  allHistory.forEach((entry) => {
    const user = users.find(u => u.id === entry.userId);
    if (!user) return;

    if (!userHistoryMap.has(entry.userId)) {
      userHistoryMap.set(entry.userId, {
        user,
        currentDevices: [],
        previousDevices: []
      });
    }

    const userHistory = userHistoryMap.get(entry.userId)!;
    if (entry.releasedAt) {
      userHistory.previousDevices.push(entry);
    } else {
      userHistory.currentDevices.push(entry);
    }
  });

  // Filter user history
  const filteredUserHistory = Array.from(userHistoryMap.values()).filter((userHistory) => {
    const matchesSearch = userHistory.user.name.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesStatus = 
      userStatusFilter === 'all' ||
      (userStatusFilter === 'current' && userHistory.currentDevices.length > 0) ||
      (userStatusFilter === 'previous' && userHistory.previousDevices.length > 0);

    return matchesSearch && matchesStatus;
  });

  const isLoading = devicesLoading || usersLoading;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device History</h1>
            <p className="text-muted-foreground">
              View ownership history by device or by user
            </p>
          </div>
          <History className="h-8 w-8 text-muted-foreground" />
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Device History
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              User History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Ownership History</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by user, device, or serial number..."
                      value={deviceSearchTerm}
                      onChange={(e) => setDeviceSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={deviceStatusFilter} onValueChange={setDeviceStatusFilter}>
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
                      {filteredDeviceHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No history records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeviceHistory
                          .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                          .map((entry) => {
                            const device = getDeviceInfo(entry.deviceId);
                            const isActive = !entry.releasedAt;

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
                                  <span className="text-sm">{calculateDuration(entry.assignedAt, entry.releasedAt)}</span>
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
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Device History</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by user name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="current">Has Current Devices</SelectItem>
                      <SelectItem value="previous">Has Previous Devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredUserHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No user history found
                      </div>
                    ) : (
                      filteredUserHistory.map((userHistory) => (
                        <div key={userHistory.user.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{userHistory.user.name}</h3>
                            <div className="flex gap-2">
                              {userHistory.currentDevices.length > 0 && (
                                <Badge variant="default">
                                  {userHistory.currentDevices.length} Current
                                </Badge>
                              )}
                              {userHistory.previousDevices.length > 0 && (
                                <Badge variant="secondary">
                                  {userHistory.previousDevices.length} Previous
                                </Badge>
                              )}
                            </div>
                          </div>

                          {userHistory.currentDevices.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Devices</h4>
                              <div className="space-y-2">
                                {userHistory.currentDevices.map((entry) => {
                                  const device = getDeviceInfo(entry.deviceId);
                                  return (
                                    <div key={entry.id} className="flex items-center justify-between bg-muted/50 rounded p-2">
                                      <div>
                                        <div className="font-medium">{device?.project || 'Unknown Device'}</div>
                                        <div className="text-sm text-muted-foreground">
                                          S/N: {device?.serialNumber || 'N/A'} • Assigned: {formatDate(entry.assignedAt)}
                                        </div>
                                      </div>
                                      <Badge variant="default">Active</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {userHistory.previousDevices.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">Previous Devices</h4>
                              <div className="space-y-2">
                                {userHistory.previousDevices
                                  .sort((a, b) => new Date(b.releasedAt!).getTime() - new Date(a.releasedAt!).getTime())
                                  .map((entry) => {
                                    const device = getDeviceInfo(entry.deviceId);
                                    return (
                                      <div key={entry.id} className="flex items-center justify-between bg-muted/20 rounded p-2">
                                        <div>
                                          <div className="font-medium">{device?.project || 'Unknown Device'}</div>
                                          <div className="text-sm text-muted-foreground">
                                            S/N: {device?.serialNumber || 'N/A'} • 
                                            {formatDate(entry.assignedAt)} - {formatDate(entry.releasedAt)} • 
                                            Duration: {calculateDuration(entry.assignedAt, entry.releasedAt)}
                                          </div>
                                        </div>
                                        <Badge variant="secondary">Returned</Badge>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DeviceHistoryPage;
