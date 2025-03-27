
import { useState, useEffect, useCallback } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';
import { useAuth } from '@/components/auth/AuthProvider';

interface UseDeviceFiltersProps {
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  refreshTrigger?: number;
}

export const useDeviceFilters = ({
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
  refreshTrigger = 0
}: UseDeviceFiltersProps) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching devices and users...');
      const [fetchedDevices, fetchedUsers] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      setDevices(fetchedDevices || []);
      setUsers(fetchedUsers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);
  
  // Filter device types from device list
  const deviceTypes = Array.from(new Set(devices.map(device => device.type)))
    .filter(Boolean)
    .sort();
  
  // Fetch data when component mounts or refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);
  
  // Apply filters to devices
  const filteredDevices = devices.filter(device => {
    // Search query filter - check project, type, serial number, IMEI, and notes
    if (searchQuery && !device.project?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.type?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.imei?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.notes?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (typeFilter && device.type !== typeFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter) {
      if (statusFilter === 'pending' && !device.requestedBy) {
        return false;
      } else if (statusFilter !== 'pending' && device.status !== statusFilter) {
        return false;
      }
    }
    
    // Available filter
    if (filterByAvailable && device.status !== 'available') {
      return false;
    }
    
    // Status array filter
    if (filterByStatus && filterByStatus.length > 0 && !filterByStatus.includes(device.status)) {
      return false;
    }
    
    // Assigned to user filter
    if (filterByAssignedToUser) {
      if (device.assignedToId !== filterByAssignedToUser) {
        return false;
      }
    }
    
    return true;
  });
  
  return {
    devices,
    users,
    filteredDevices,
    deviceTypes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    fetchData
  };
};
