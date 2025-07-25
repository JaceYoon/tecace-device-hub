
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import { dataService } from '@/services/data.service';
import { Device, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, History, Monitor, User as UserIcon, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  // Search states
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  
  // Display control states
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // History data
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Fetch basic data
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => dataService.devices.getAll(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => dataService.users.getAll(),
  });

  // Memoized device and user maps for performance
  const deviceMap = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach(device => map.set(device.id, device));
    return map;
  }, [devices]);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(String(user.id), user));
    return map;
  }, [users]);

  // Process history entries with performance optimization
  const processHistoryEntries = useCallback((rawHistory: any[]): HistoryEntry[] => {
    if (!rawHistory || rawHistory.length === 0) return [];

    const processedEntries: HistoryEntry[] = [];
    const deviceHistoryMap = new Map<string, any[]>();
    
    // Group by device for efficient processing
    rawHistory.forEach(entry => {
      if (!entry?.deviceId || !entry?.userId) return;
      
      if (!deviceHistoryMap.has(entry.deviceId)) {
        deviceHistoryMap.set(entry.deviceId, []);
      }
      deviceHistoryMap.get(entry.deviceId)!.push(entry);
    });
    
    deviceHistoryMap.forEach((entries, deviceId) => {
      const device = deviceMap.get(deviceId);
      if (!device) return;
      
      // Sort entries by date
      entries.sort((a, b) => {
        const dateA = new Date(a.assignedAt || a.releasedAt).getTime();
        const dateB = new Date(b.assignedAt || b.releasedAt).getTime();
        return dateA - dateB;
      });
      
      const assignEntries = entries.filter(e => e.assignedAt);
      const releaseEntries = entries.filter(e => e.releasedAt);
      
      assignEntries.forEach(assignEntry => {
        const correspondingRelease = releaseEntries.find(releaseEntry => {
          const assignDate = new Date(assignEntry.assignedAt);
          const releaseDate = new Date(releaseEntry.releasedAt);
          const sameUser = String(assignEntry.userId) === String(releaseEntry.userId);
          const releaseAfterAssign = releaseDate > assignDate;
          
          return sameUser && releaseAfterAssign;
        });
        
        const isCurrentlyActive = !correspondingRelease && 
          device.status === 'assigned' && 
          String(device.assignedToId) === String(assignEntry.userId);
        
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
    
    return processedEntries;
  }, [deviceMap]);

  // Optimized history fetching - skip history completely for better performance
  const fetchAllHistory = useCallback(async () => {
    if (historyLoaded) return;
    
    setLoadingHistory(true);
    try {
      console.log('Skipping individual history fetch for performance - using device assignment data only');
      
      // Create minimal history entries from current device assignments only
      const minimalHistory: HistoryEntry[] = [];
      
      devices.forEach(device => {
        if (device.assignedToId && device.status === 'assigned') {
          const user = userMap.get(String(device.assignedToId));
          if (user) {
            minimalHistory.push({
              id: `current-${device.id}`,
              deviceId: device.id,
              userId: String(device.assignedToId),
              userName: user.name,
              assignedAt: device.updatedAt.toString(),
              releasedAt: null,
              releasedById: null,
              releasedByName: null,
              releaseReason: null,
              isActive: true
            });
          }
        }
      });
      
      setAllHistory(minimalHistory);
      setHistoryLoaded(true);
      console.log(`Loaded ${minimalHistory.length} current assignments (optimized)`);
      
    } catch (error) {
      console.error('Error creating minimal history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [historyLoaded, devices, userMap]);

  // Auto-trigger history loading when search is entered
  const handleSearchInput = useCallback((searchTerm: string, isDevice: boolean) => {
    if (isDevice) {
      setDeviceSearchTerm(searchTerm);
    } else {
      setUserSearchTerm(searchTerm);
    }
    
    // Auto-load history if search term exists but history not loaded
    if (searchTerm && !historyLoaded && !loadingHistory) {
      fetchAllHistory();
    }
  }, [historyLoaded, loadingHistory, fetchAllHistory]);

  // Utility functions
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Present';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  const calculateDuration = useCallback((assignedAt: string, releasedAt: string | null) => {
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
  }, []);

  // Memoized filtered data with performance optimization
  const devicesWithHistory: DeviceWithHistory[] = useMemo(() => {
    if (!historyLoaded || allHistory.length === 0) return [];
    
    const deviceHistoryMap = new Map<string, HistoryEntry[]>();
    
    // Group history by device efficiently
    allHistory.forEach((entry) => {
      if (!deviceHistoryMap.has(entry.deviceId)) {
        deviceHistoryMap.set(entry.deviceId, []);
      }
      deviceHistoryMap.get(entry.deviceId)!.push(entry);
    });

    const result: DeviceWithHistory[] = [];
    deviceHistoryMap.forEach((history, deviceId) => {
      const device = deviceMap.get(deviceId);
      if (device) {
        const sortedHistory = history.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
        const currentOwner = sortedHistory.find(entry => entry.isActive);
        
        result.push({
          device,
          history: sortedHistory,
          currentOwner
        });
      }
    });

    return result;
  }, [allHistory, deviceMap, historyLoaded]);

  const usersWithHistory: UserWithHistory[] = useMemo(() => {
    if (!historyLoaded || allHistory.length === 0) return [];
    
    const userHistoryMap = new Map<string, {
      user: User;
      currentDevices: (HistoryEntry & { device?: Device })[];
      previousDevices: (HistoryEntry & { device?: Device })[];
    }>();

    allHistory.forEach((entry) => {
      const user = userMap.get(entry.userId);
      const device = deviceMap.get(entry.deviceId);
      
      if (!user) return;

      const userKey = String(user.id);
      
      if (!userHistoryMap.has(userKey)) {
        userHistoryMap.set(userKey, {
          user,
          currentDevices: [],
          previousDevices: []
        });
      }

      const userHistory = userHistoryMap.get(userKey)!;
      const entryWithDevice = { ...entry, device };
      
      if (entry.isActive) {
        userHistory.currentDevices.push(entryWithDevice);
      } else {
        userHistory.previousDevices.push(entryWithDevice);
      }
    });

    return Array.from(userHistoryMap.values()).filter(userHistory => 
      userHistory.currentDevices.length > 0 || userHistory.previousDevices.length > 0
    );
  }, [allHistory, userMap, deviceMap, historyLoaded]);

  // Filtered results with search optimization
  const filteredDevicesWithHistory = useMemo(() => {
    // Show results if either searching or showing all
    if (!showAllDevices && !deviceSearchTerm) return [];
    
    return devicesWithHistory.filter((deviceWithHistory) => {
      const matchesSearch = !deviceSearchTerm || 
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
  }, [devicesWithHistory, deviceSearchTerm, deviceStatusFilter, showAllDevices]);

  const filteredUsersWithHistory = useMemo(() => {
    // Show results if either searching or showing all
    if (!showAllUsers && !userSearchTerm) return [];
    
    return usersWithHistory.filter((userWithHistory) => {
      const matchesSearch = !userSearchTerm || 
        userWithHistory.user.name.toLowerCase().includes(userSearchTerm.toLowerCase());
      
      const matchesStatus = 
        userStatusFilter === 'all' ||
        (userStatusFilter === 'current' && userWithHistory.currentDevices.length > 0) ||
        (userStatusFilter === 'previous' && userWithHistory.previousDevices.length > 0);

      return matchesSearch && matchesStatus;
    });
  }, [usersWithHistory, userSearchTerm, userStatusFilter, showAllUsers]);

  const isLoading = devicesLoading || usersLoading;
  const hasSearchOrShowAll = (deviceSearchTerm || showAllDevices) || (userSearchTerm || showAllUsers);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device History</h1>
            <p className="text-muted-foreground">
              Search for devices or users to view their rental history
            </p>
          </div>
          <History className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Performance Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            For optimal performance with large datasets ({devices.length} devices), use search to find specific devices or users. 
            Use "Show All" carefully with large datasets.
          </AlertDescription>
        </Alert>

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
                <CardTitle>Device Rental History</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <DebouncedInput
                      placeholder="Search by device name, serial number, IMEI, or user..."
                      value={deviceSearchTerm}
                      onChange={(value) => handleSearchInput(value, true)}
                      className="pl-10"
                      debounceMs={300}
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
                  <Button 
                    variant={showAllDevices ? "default" : "outline"}
                    onClick={() => {
                      setShowAllDevices(!showAllDevices);
                      if (!showAllDevices && !historyLoaded) {
                        fetchAllHistory();
                      }
                    }}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      showAllDevices ? "Hide All" : "Show All"
                    )}
                  </Button>
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
                ) : !hasSearchOrShowAll ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Search for Device History</h3>
                    <p>Enter a search term or click "Show All" to view device rental history.</p>
                    <p className="text-sm mt-2">Optimized for datasets with {devices.length} devices.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDevicesWithHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading device history...</span>
                          </div>
                        ) : (
                          "No devices with rental history found"
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mb-4">
                          Showing {filteredDevicesWithHistory.length} device{filteredDevicesWithHistory.length !== 1 ? 's' : ''} with history
                        </div>
                        {filteredDevicesWithHistory.map((deviceWithHistory) => (
                          <div key={deviceWithHistory.device.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
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
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View History
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[600px] max-h-[400px] overflow-y-auto">
                                    <div className="space-y-4">
                                      <h4 className="font-medium">Rental History - {deviceWithHistory.device.project}</h4>
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
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Rental History</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <DebouncedInput
                      placeholder="Search by user name..."
                      value={userSearchTerm}
                      onChange={(value) => handleSearchInput(value, false)}
                      className="pl-10"
                      debounceMs={300}
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
                  <Button 
                    variant={showAllUsers ? "default" : "outline"}
                    onClick={() => {
                      setShowAllUsers(!showAllUsers);
                      if (!showAllUsers && !historyLoaded) {
                        fetchAllHistory();
                      }
                    }}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      showAllUsers ? "Hide All" : "Show All"
                    )}
                  </Button>
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
                ) : !hasSearchOrShowAll ? (
                  <div className="text-center text-muted-foreground py-12">
                    <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Search for User History</h3>
                    <p>Enter a search term or click "Show All" to view user rental history.</p>
                    <p className="text-sm mt-2">Optimized for datasets with {users.length} users.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsersWithHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading user history...</span>
                          </div>
                        ) : (
                          "No users with rental history found"
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mb-4">
                          Showing {filteredUsersWithHistory.length} user{filteredUsersWithHistory.length !== 1 ? 's' : ''} with history
                        </div>
                        {filteredUsersWithHistory.map((userWithHistory) => (
                          <div key={userWithHistory.user.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
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
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Devices
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[500px] max-h-[400px] overflow-y-auto">
                                    <div className="space-y-4">
                                      <h4 className="font-medium">Device History - {userWithHistory.user.name}</h4>
                                      
                                      {userWithHistory.currentDevices.length > 0 && (
                                        <div>
                                          <h5 className="font-medium text-sm text-muted-foreground mb-2">Current Devices</h5>
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
                                          <h5 className="font-medium text-sm text-muted-foreground mb-2">Previous Devices</h5>
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
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
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
