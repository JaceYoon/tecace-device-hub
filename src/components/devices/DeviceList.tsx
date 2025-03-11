
import React, { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import DeviceCard from './DeviceCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dataStore } from '@/utils/mockData';
import { Search } from 'lucide-react';

interface DeviceListProps {
  title?: string;
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  showControls?: boolean;
  className?: string;
}

const DeviceList: React.FC<DeviceListProps> = ({
  title = 'Devices',
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
  showControls = true,
  className,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Get unique device types
  const deviceTypes = [...new Set(devices.map(device => device.type))];
  
  // Fetch devices and users
  const fetchData = () => {
    setDevices(dataStore.getDevices());
    setUsers(dataStore.getUsers());
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter devices
  const filteredDevices = devices.filter(device => {
    // Text search
    const matchesSearch = 
      searchQuery === '' || 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.imei.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      device.status === statusFilter;
    
    // Type filter
    const matchesType = 
      typeFilter === 'all' || 
      device.type === typeFilter;
    
    // Available filter
    const matchesAvailable = 
      !filterByAvailable || 
      device.status === 'available';
    
    // Assigned to user filter
    const matchesAssignedToUser = 
      !filterByAssignedToUser || 
      device.assignedTo === filterByAssignedToUser;
    
    // Status filter array
    const matchesStatusArray = 
      !filterByStatus || 
      filterByStatus.includes(device.status);
    
    return matchesSearch && 
           matchesStatus && 
           matchesType && 
           matchesAvailable && 
           matchesAssignedToUser &&
           matchesStatusArray;
  });
  
  return (
    <div className={className}>
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight mb-6">{title}</h2>
      )}
      
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, serial, or IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {deviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => (
            <DeviceCard 
              key={device.id} 
              device={device} 
              users={users}
              onAction={fetchData}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <p className="text-lg text-muted-foreground">No devices found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceList;
