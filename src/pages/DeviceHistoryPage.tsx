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
import { Search, History, Monitor, User as UserIcon, ChevronDown, ChevronRight } from 'lucide-react';
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
  isActive: boolean;
}

interface DeviceWithHistory {
  device: Device;
  history: HistoryEntry[];
  currentOwner?: HistoryEntry;
}

interface UserWithHistory {
  user: User;
  currentDevices: (HistoryEntry & { device?: Device })[];
  previousDevices: (HistoryEntry & { device?: Device })[];
}

const DeviceHistoryPage = () => {
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

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
      
      try {
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
        
        console.log('Raw history data:', flatHistory);
        
        const processedHistory = processHistoryEntries(flatHistory);
        
        console.log('Processed history entries:', processedHistory.length);
        setAllHistory(processedHistory);
      } catch (error) {
        console.error('Error fetching all history:', error);
      }
    };

    if (!devicesLoading && devices.length > 0) {
      fetchAllHistory();
    }
  }, [devices, devicesLoading]);

  // Process raw history entries to create proper assignment periods
  const processHistoryEntries = (rawHistory: any[]): HistoryEntry[] => {
    console.log('Processing history entries, raw count:', rawHistory.length);
    
    if (!rawHistory || rawHistory.length === 0) {
      return [];
    }

    const processedEntries: HistoryEntry[] = [];
    
    // Group entries by device
    const deviceMap = new Map<string, any[]>();
    
    rawHistory.forEach(entry => {
      if (!entry || !entry.deviceId || !entry.userId) {
        return;
      }
      
      if (!deviceMap.has(entry.deviceId)) {
        deviceMap.set(entry.deviceId, []);
      }
      deviceMap.get(entry.deviceId)!.push(entry);
    });
    
    console.log('Device groups found:', deviceMap.size);
    
    deviceMap.forEach((entries, deviceId) => {
      // Sort entries by date (oldest first)
      entries.sort((a, b) => {
        const dateA = new Date(a.assignedAt || a.releasedAt).getTime();
        const dateB = new Date(b.assignedAt || b.releasedAt).getTime();
        return dateA - dateB;
      });
      
      const device = devices.find(d => d.id === deviceId);
      
      // Process each assign/release pair
      const assignEntries = entries.filter(e => e.assignedAt);
      const releaseEntries = entries.filter(e => e.releasedAt);
      
      console.log(`Device ${deviceId}: ${assignEntries.length} assigns, ${releaseEntries.length} releases`);
      
      assignEntries.forEach(assignEntry => {
        // Find the corresponding release entry for this assignment
        const correspondingRelease = releaseEntries.find(releaseEntry => {
          const assignDate = new Date(assignEntry.assignedAt);
          const releaseDate = new Date(releaseEntry.releasedAt);
          const sameUser = String(assignEntry.userId) === String(releaseEntry.userId);
          const releaseAfterAssign = releaseDate > assignDate;
          
          return sameUser && releaseAfterAssign;
        });
        
        // Check if this assignment is currently active
        const isCurrentlyActive = !correspondingRelease && 
          device && 
          device.status === 'assigned' && 
          String(device.assignedToId) === String(assignEntry.userId);
        
        console.log(`Processing assignment for device ${deviceId}, user ${assignEntry.userId}:`, {
          assignedAt: assignEntry.assignedAt,
          releasedAt: correspondingRelease?.releasedAt || null,
          isActive: isCurrentlyActive
        });
        
        processedEntries.push({
          id: `${deviceId}-${assignEntry.userId}-${assignEntry.assignedAt}`,
          deviceId,
          userId: String(assignEntry.userId),
          userName: assignEntry.userName,
          assignedAt: assignEntry.assignedAt,
          releasedAt: correspondingRelease ? correspondingRelease.releasedAt : null,
          releasedById: correspondingRelease ? String(correspondingRelease.releasedById) : null,
          releasedByName: correspondingRelease ? correspondingRelease.releasedByName : null,
          releaseReason: correspondingRelease ? correspondingRelease.releaseReason : null,
          isActive: isCurrentlyActive
        });
      });
    });
    
    console.log('Final processed entries:', processedEntries.length);
    processedEntries.forEach(entry => {
      console.log(`Entry: ${entry.userName} - ${entry.deviceId}, Active: ${entry.isActive}, Released: ${entry.releasedAt || 'No'}`);
    });
    
    return processedEntries;
  };

  const getDeviceInfo = (deviceId: string) => {
    return devices.find(d => d.id === deviceId);
  };

  const getUserInfo = (userId: string) => {
    // Convert both user ID and entry user ID to strings for comparison
    return users.find(u => String(u.id) === String(userId));
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

  // Group devices with their rental history
  const devicesWithHistory: DeviceWithHistory[] = React.useMemo(() => {
    const deviceHistoryMap = new Map<string, HistoryEntry[]>();
    
    // Group history by device
    allHistory.forEach((entry) => {
      if (!deviceHistoryMap.has(entry.deviceId)) {
        deviceHistoryMap.set(entry.deviceId, []);
      }
      deviceHistoryMap.get(entry.deviceId)!.push(entry);
    });

    const result: DeviceWithHistory[] = [];
    deviceHistoryMap.forEach((history, deviceId) => {
      const device = getDeviceInfo(deviceId);
      if (device) {
        const sortedHistory = history.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
        
        // Find current owner - the active entry
        const currentOwner = sortedHistory.find(entry => entry.isActive);
        
        result.push({
          device,
          history: sortedHistory,
          currentOwner
        });
      }
    });

    console.log('Devices with history:', result.length);
    return result;
  }, [allHistory, devices]);

  // Group users with their rental history
  const usersWithHistory: UserWithHistory[] = React.useMemo(() => {
    console.log('Processing users with history...');
    console.log('All history entries:', allHistory.length);
    console.log('All users:', users.length);
    
    if (allHistory.length === 0 || users.length === 0) {
      console.log('No history or users available');
      return [];
    }
    
    const userHistoryMap = new Map<string, {
      user: User;
      currentDevices: (HistoryEntry & { device?: Device })[];
      previousDevices: (HistoryEntry & { device?: Device })[];
    }>();

    // Process each history entry
    allHistory.forEach((entry) => {
      const user = getUserInfo(entry.userId);
      const device = getDeviceInfo(entry.deviceId);
      
      if (!user) {
        console.log(`User not found for entry: ${entry.userId}. Available user IDs:`, users.map(u => `${u.id} (${typeof u.id})`));
        return;
      }

      // Use string user ID as key for consistency
      const userKey = String(user.id);
      
      // Initialize user history if not exists
      if (!userHistoryMap.has(userKey)) {
        userHistoryMap.set(userKey, {
          user,
          currentDevices: [],
          previousDevices: []
        });
      }

      const userHistory = userHistoryMap.get(userKey)!;
      const entryWithDevice = { ...entry, device };
      
      console.log(`Processing entry for user ${user.name}:`, {
        device: device?.project,
        isActive: entry.isActive,
        assignedAt: entry.assignedAt,
        releasedAt: entry.releasedAt
      });
      
      if (entry.isActive) {
        userHistory.currentDevices.push(entryWithDevice);
        console.log(`Added current device for ${user.name}: ${device?.project}`);
      } else {
        userHistory.previousDevices.push(entryWithDevice);
        console.log(`Added previous device for ${user.name}: ${device?.project}`);
      }
    });

    // Convert map to array and filter out users with no history
    const result = Array.from(userHistoryMap.values()).filter(userHistory => 
      userHistory.currentDevices.length > 0 || userHistory.previousDevices.length > 0
    );
    
    console.log(`Final users with history: ${result.length}`);
    result.forEach(userHistory => {
      console.log(`User ${userHistory.user.name}: ${userHistory.currentDevices.length} current, ${userHistory.previousDevices.length} previous`);
    });
    
    return result;
  }, [allHistory, users, devices]);

  // Filter devices with history
  const filteredDevicesWithHistory = devicesWithHistory.filter((deviceWithHistory) => {
    const matchesSearch = 
      deviceWithHistory.device.project?.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
      deviceWithHistory.device.serialNumber?.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
      deviceWithHistory.device.imei?.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
      deviceWithHistory.history.some(entry => 
        entry.userName.toLowerCase().includes(deviceSearchTerm.toLowerCase())
      );

    const matchesStatus = 
      deviceStatusFilter === 'all' ||
      (deviceStatusFilter === 'active' && deviceWithHistory.currentOwner) ||
      (deviceStatusFilter === 'returned' && !deviceWithHistory.currentOwner);

    return matchesSearch && matchesStatus;
  });

  // Filter users with history
  const filteredUsersWithHistory = usersWithHistory.filter((userWithHistory) => {
    const matchesSearch = userWithHistory.user.name.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesStatus = 
      userStatusFilter === 'all' ||
      (userStatusFilter === 'current' && userWithHistory.currentDevices.length > 0) ||
      (userStatusFilter === 'previous' && userWithHistory.previousDevices.length > 0);

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
                <CardTitle>Devices with Rental History</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by device, serial number, IMEI, or user..."
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
                      <SelectItem value="all">All Devices</SelectItem>
                      <SelectItem value="active">Currently Assigned</SelectItem>
                      <SelectItem value="returned">Available</SelectItem>
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
                  <div className="space-y-4">
                    {filteredDevicesWithHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No devices with rental history found
                      </div>
                    ) : (
                      filteredDevicesWithHistory.map((deviceWithHistory) => (
                        <div key={deviceWithHistory.device.id} className="border rounded-lg">
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                            onClick={() => setExpandedDeviceId(
                              expandedDeviceId === deviceWithHistory.device.id ? null : deviceWithHistory.device.id
                            )}
                          >
                            <div className="flex items-center gap-4">
                              {expandedDeviceId === deviceWithHistory.device.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <div className="font-medium">{deviceWithHistory.device.project || 'Unknown Device'}</div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {deviceWithHistory.device.serialNumber && (
                                    <div>S/N: {deviceWithHistory.device.serialNumber}</div>
                                  )}
                                  {deviceWithHistory.device.imei && (
                                    <div>IMEI: {deviceWithHistory.device.imei}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={deviceWithHistory.currentOwner ? "default" : "secondary"}>
                                {deviceWithHistory.currentOwner ? "Currently Assigned" : "Available"}
                              </Badge>
                              <Badge variant="outline">
                                {deviceWithHistory.history.length} rental{deviceWithHistory.history.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          
                          {expandedDeviceId === deviceWithHistory.device.id && (
                            <div className="border-t p-4">
                              <h4 className="font-medium mb-3">Rental History</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>Returned</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Duration</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {deviceWithHistory.history.map((entry) => (
                                    <TableRow key={entry.id}>
                                      <TableCell>
                                        <div className="font-medium">{entry.userName}</div>
                                      </TableCell>
                                      <TableCell>{formatDate(entry.assignedAt)}</TableCell>
                                      <TableCell>{formatDate(entry.releasedAt)}</TableCell>
                                      <TableCell>
                                        <Badge variant={entry.isActive ? "default" : "secondary"}>
                                          {entry.isActive ? "Active" : "Returned"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm">{calculateDuration(entry.assignedAt, entry.releasedAt)}</span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users with Rental History</CardTitle>
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
                  <div className="space-y-4">
                    {filteredUsersWithHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No users with rental history found
                      </div>
                    ) : (
                      filteredUsersWithHistory.map((userWithHistory) => (
                        <div key={userWithHistory.user.id} className="border rounded-lg">
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                            onClick={() => setExpandedUserId(
                              expandedUserId === userWithHistory.user.id ? null : userWithHistory.user.id
                            )}
                          >
                            <div className="flex items-center gap-4">
                              {expandedUserId === userWithHistory.user.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold">{userWithHistory.user.name}</h3>
                                <p className="text-sm text-muted-foreground">{userWithHistory.user.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {userWithHistory.currentDevices.length > 0 && (
                                <Badge variant="default">
                                  {userWithHistory.currentDevices.length} Current
                                </Badge>
                              )}
                              {userWithHistory.previousDevices.length > 0 && (
                                <Badge variant="secondary">
                                  {userWithHistory.previousDevices.length} Previous
                                </Badge>
                              )}
                            </div>
                          </div>

                          {expandedUserId === userWithHistory.user.id && (
                            <div className="border-t p-4 space-y-4">
                              {userWithHistory.currentDevices.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Devices</h4>
                                  <div className="space-y-2">
                                    {userWithHistory.currentDevices.map((entry) => (
                                      <div key={entry.id} className="flex items-center justify-between bg-muted/50 rounded p-3">
                                        <div className="flex-1">
                                          <div className="font-medium">{entry.device?.project || 'Unknown Device'}</div>
                                          <div className="text-sm text-muted-foreground space-y-1">
                                            {entry.device?.serialNumber && (
                                              <div>S/N: {entry.device.serialNumber}</div>
                                            )}
                                            {entry.device?.imei && (
                                              <div>IMEI: {entry.device.imei}</div>
                                            )}
                                            <div>Assigned: {formatDate(entry.assignedAt)}</div>
                                          </div>
                                        </div>
                                        <Badge variant="default">Active</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {userWithHistory.previousDevices.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Previous Devices</h4>
                                  <div className="space-y-2">
                                    {userWithHistory.previousDevices
                                      .sort((a, b) => new Date(b.releasedAt!).getTime() - new Date(a.releasedAt!).getTime())
                                      .map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between bg-muted/20 rounded p-3">
                                          <div className="flex-1">
                                            <div className="font-medium">{entry.device?.project || 'Unknown Device'}</div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                              {entry.device?.serialNumber && (
                                                <div>S/N: {entry.device.serialNumber}</div>
                                              )}
                                              {entry.device?.imei && (
                                                <div>IMEI: {entry.device.imei}</div>
                                              )}
                                              <div>
                                                {formatDate(entry.assignedAt)} - {formatDate(entry.releasedAt)} • 
                                                Duration: {calculateDuration(entry.assignedAt, entry.releasedAt)}
                                              </div>
                                            </div>
                                          </div>
                                          <Badge variant="secondary">Returned</Badge>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
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
