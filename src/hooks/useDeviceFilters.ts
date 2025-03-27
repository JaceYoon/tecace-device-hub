
import { useState, useEffect, useCallback } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useDeviceFilters = (initialDevices: Device[] = []) => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(initialDevices);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deviceTypes, setDeviceTypes] = useState(['all']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter devices based on search query, status, and type
  const filterDevices = useCallback(() => {
    let filtered = devices;

    // Filter by search query (project, serialNumber, imei, notes)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(device => {
        return (
          device.project?.toLowerCase().includes(searchLower) || 
          device.serialNumber?.toLowerCase().includes(searchLower) || 
          device.imei?.toLowerCase().includes(searchLower) ||
          device.notes?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Filter devices with pending requests
        filtered = filtered.filter(device => device.requestedBy !== undefined);
      } else {
        // Filter by device status
        filtered = filtered.filter(device => device.status === statusFilter);
      }
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(device => device.type === typeFilter);
    }

    setFilteredDevices(filtered);
  }, [devices, searchQuery, statusFilter, typeFilter]);

  // Fetch devices and users
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [devicesData, usersData] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);

      // Extract unique device types
      const types = Array.from(new Set([
        'all',
        ...devicesData.map(device => device.type)
      ])).filter(Boolean);

      setDevices(devicesData);
      setUsers(usersData);
      setDeviceTypes(types);
      
      // Apply filters to the new data
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data for filters:', err);
      setError('Failed to load data');
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();

    // Register refresh callback
    const unregister = dataService.registerRefreshCallback(fetchData);
    
    // Cleanup on unmount
    return () => {
      unregister();
    };
  }, [fetchData]);

  // Apply filters when any filter criteria or data changes
  useEffect(() => {
    filterDevices();
  }, [filterDevices, devices, searchQuery, statusFilter, typeFilter]);

  return {
    devices,
    filteredDevices,
    users,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deviceTypes,
    isLoading,
    error,
    refreshData: fetchData
  };
};

export default useDeviceFilters;
