
import { useState, useEffect, useMemo } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';

interface UseDeviceFiltersProps {
  devices?: Device[];
  users?: User[];
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  refreshTrigger?: number;
}

export const useDeviceFilters = (props: UseDeviceFiltersProps = {}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Extract unique device types for filter dropdown
  const deviceTypes = useMemo(() => {
    const types = devices
      .map(device => device.type)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['all', ...types];
  }, [devices]);

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fix: Use getAll() instead of getDevices() with arguments
      const [devicesData, usersData] = await Promise.all([
        dataService.devices.getAll(),
        dataService.users.getAll()
      ]);
      
      // Apply filters in memory after fetching all devices
      let filteredDevices = devicesData;
      
      if (props.filterByAvailable) {
        filteredDevices = filteredDevices.filter(device => device.status === 'available');
      }
      
      if (props.filterByAssignedToUser) {
        filteredDevices = filteredDevices.filter(device => device.assignedToId === props.filterByAssignedToUser);
      }
      
      if (props.filterByStatus && props.filterByStatus.length > 0) {
        filteredDevices = filteredDevices.filter(device => props.filterByStatus?.includes(device.status));
      }
      
      setDevices(filteredDevices);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [props.refreshTrigger, props.filterByAssignedToUser, props.filterByStatus, props.filterByAvailable]);

  // Filter devices based on search query, status, and type
  const filteredDevices = useMemo(() => {
    if (!devices) return [];

    return devices.filter(device => {
      // Apply search filter (case insensitive)
      const matchesSearch =
        searchQuery === '' ||
        device.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.imei && device.imei.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.notes && device.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Apply status filter
      let matchesStatus = statusFilter === 'all';
      
      if (statusFilter === 'available') {
        matchesStatus = device.status === 'available';
      } else if (statusFilter === 'assigned') {
        matchesStatus = device.status === 'assigned';
      } else if (statusFilter === 'pending') {
        matchesStatus = !!device.requestedBy;
      } else if (statusFilter === 'missing') {
        matchesStatus = device.status === 'missing';
      } else if (statusFilter === 'stolen') {
        matchesStatus = device.status === 'stolen';
      }
      
      // Apply type filter
      const matchesType = typeFilter === 'all' || device.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchQuery, statusFilter, typeFilter]);

  // Add function to manually refresh data
  const refreshData = async () => {
    return await fetchData();
  };

  return {
    devices,
    users,
    filteredDevices,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deviceTypes,
    fetchData,
    refreshData,
    loading
  };
};
