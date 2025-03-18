
import { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';

interface UseDeviceFiltersProps {
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
}

export const useDeviceFilters = (props: UseDeviceFiltersProps = {}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Get unique device types from the devices array
  const deviceTypes = ['all', ...new Set(
    devices.map(device => device.type)
      .filter(Boolean)
      .sort()
  )];
  
  // Fetch devices and users
  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesData, usersData] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      setDevices(devicesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter devices based on filters
  const filteredDevices = devices.filter(device => {
    // Filter by search query
    if (searchQuery && !device.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.imei.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'all' && device.status !== statusFilter) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all' && device.type !== typeFilter) {
      return false;
    }
    
    // Filter by available only
    if (props.filterByAvailable && device.status !== 'available') {
      return false;
    }
    
    // Filter by assigned to user
    if (props.filterByAssignedToUser && device.assignedTo !== props.filterByAssignedToUser) {
      return false;
    }
    
    // Filter by allowed statuses
    if (props.filterByStatus && props.filterByStatus.length > 0 && 
        !props.filterByStatus.includes(device.status)) {
      return false;
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
    loading,
    fetchData
  };
};
