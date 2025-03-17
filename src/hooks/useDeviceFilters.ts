
import { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { dataStore } from '@/utils/data';

interface UseDeviceFiltersProps {
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
}

export const useDeviceFilters = ({
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
}: UseDeviceFiltersProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Get unique device types - with null check
  const deviceTypes = devices?.length ? [...new Set(devices.map(device => device.type))] : [];
  
  // Fetch devices and users
  const fetchData = () => {
    try {
      const fetchedDevices = dataStore.getDevices() || [];
      const fetchedUsers = dataStore.getUsers() || [];
      setDevices(fetchedDevices);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter devices
  const filteredDevices = devices?.filter(device => {
    // Text search
    const matchesSearch = 
      searchQuery === '' || 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.imei && device.imei.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      device.status === statusFilter;
    
    // Type filter
    const matchesType = 
      typeFilter === 'all' || 
      device.type === typeFilter;
    
    // Available filter - also include devices that are not requested by anyone
    const matchesAvailable = 
      !filterByAvailable || 
      (device.status === 'available' && !device.requestedBy);
    
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
  }) || [];
  
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
