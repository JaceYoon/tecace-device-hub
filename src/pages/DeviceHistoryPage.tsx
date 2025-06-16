
import React, { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Search, Filter, User as UserIcon, Smartphone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

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

const DeviceHistoryPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devicesData, usersData] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      setDevices(devicesData);
      setUsers(usersData);

      // Load history for each device
      const historyData: Record<string, HistoryEntry[]> = {};
      
      for (const device of devicesData) {
        try {
          const deviceHistory = await dataService.getDeviceHistory(device.id);
          if (deviceHistory && Array.isArray(deviceHistory)) {
            historyData[device.id] = deviceHistory;
          }
        } catch (error) {
          console.error(`Error loading history for device ${device.id}:`, error);
        }
      }
      
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading device history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getAllHistoryEntries = () => {
    const allEntries: (HistoryEntry & { device: Device })[] = [];
    
    Object.entries(history).forEach(([deviceId, entries]) => {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        entries.forEach(entry => {
          allEntries.push({ ...entry, device });
        });
      }
    });

    // Sort by most recent first
    return allEntries.sort((a, b) => {
      const dateA = new Date(a.assignedAt).getTime();
      const dateB = new Date(b.assignedAt).getTime();
      return dateB - dateA;
    });
  };

  const filteredEntries = getAllHistoryEntries().filter(entry => {
    const matchesSearch = 
      entry.device.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.device.imei?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice = selectedDevice === 'all' || entry.deviceId === selectedDevice;
    const matchesUser = selectedUser === 'all' || entry.userId === selectedUser;

    return matchesSearch && matchesDevice && matchesUser;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Device History</h1>
          </div>
          
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Device History</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search devices, users, serial numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.project} ({device.serialNumber || 'No S/N'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDevice('all');
                  setSelectedUser('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{devices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">History Entries</p>
                  <p className="text-2xl font-bold">{filteredEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Entries */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No History Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedDevice !== 'all' || selectedUser !== 'all'
                    ? 'No history entries match your current filters.'
                    : 'No device history entries are available.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry, index) => (
              <Card key={`${entry.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{entry.device.project}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>S/N: {entry.device.serialNumber || 'Not available'}</span>
                        <span>IMEI: {entry.device.imei || 'Not available'}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={entry.releasedAt ? "secondary" : "default"}>
                      {entry.releasedAt ? "Completed" : "Current"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        User
                      </p>
                      <p className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        {entry.userName}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Assignment Period
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(entry.assignedAt)} - {formatDate(entry.releasedAt)}
                      </p>
                    </div>
                    
                    {entry.releaseReason && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Release Reason
                        </p>
                        <p className="text-sm">{entry.releaseReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default DeviceHistoryPage;
