import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Device, User, DeviceTypeValue } from '@/types';
import { dataService } from '@/services/data.service';

interface DeviceFiltersOptions {
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
}: DeviceFiltersOptions) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(filterByAvailable ? 'available' : 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Store the actual status filters to apply - initialized with filterByStatus
  const [effectiveStatusFilters, setEffectiveStatusFilters] = useState<string[] | undefined>(filterByStatus);
  
  // Use a ref to prevent infinite loops on initial logs
  const initialLogsDone = useRef(false);

  // Log initial filters for debugging - only once on initial mount
  useEffect(() => {
    if (!initialLogsDone.current) {
      console.log('Initial filterByStatus:', filterByStatus);
      console.log('Initial filterByAssignedToUser:', filterByAssignedToUser);
      console.log('Initial filterByAvailable:', filterByAvailable);
      initialLogsDone.current = true;
    }
  }, [filterByStatus, filterByAssignedToUser, filterByAvailable]);

  // Memoize fetchData to avoid recreation on each render
  const fetchData = useCallback(async () => {
    try {
      const [fetchedDevices, fetchedUsers] = await Promise.all([
        dataService.devices.getAll(),
        dataService.users.getAll()
      ]);
      
      console.log(`useDeviceFilters: Fetched ${fetchedDevices.length} devices`);
      
      // Debug output for assigned devices
      const assignedDevices = fetchedDevices.filter(d => d.assignedTo || d.assignedToId);
      console.log(`useDeviceFilters: Found ${assignedDevices.length} assigned devices`);
      
      setDevices(fetchedDevices);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching data for filters:', error);
      // Keep the existing data
    }
  }, []);

  // Update effective status filters when statusFilter or filterByStatus changes
  useEffect(() => {
    // If filterByStatus is provided, always use that (for My Devices)
    if (filterByStatus) {
      setEffectiveStatusFilters(filterByStatus);
    } 
    // Otherwise, use the statusFilter dropdown selection
    else if (statusFilter === 'all') {
      setEffectiveStatusFilters(undefined);
    } else {
      setEffectiveStatusFilters([statusFilter]);
    }
  }, [statusFilter, filterByStatus]);

  // Fetch devices and users when refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [refreshTrigger, fetchData]);

  const deviceTypes = useMemo(() => {
    const types = new Set<DeviceTypeValue>();
    devices.forEach(device => {
      if (device.type) {
        types.add(device.type as DeviceTypeValue);
      }
    });
    return Array.from(types);
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        (device.project && device.project.toLowerCase().includes(searchLower)) ||
        (device.projectGroup && device.projectGroup.toLowerCase().includes(searchLower)) ||
        (device.type && device.type.toLowerCase().includes(searchLower)) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchLower)) ||
        (device.imei && device.imei.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      // Filter by assigned user
      if (filterByAssignedToUser) {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        const userIdToMatch = String(filterByAssignedToUser);
        
        if (deviceAssignedTo !== userIdToMatch) {
          return false;
        }
      }
      
      // Filter by status (using effective status filters)
      if (effectiveStatusFilters && effectiveStatusFilters.length > 0) {
        if (!device.status || !effectiveStatusFilters.includes(device.status)) {
          return false;
        }
      }
      
      // Filter by type
      if (typeFilter !== 'all' && device.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [devices, searchQuery, typeFilter, effectiveStatusFilters, filterByAssignedToUser]);

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
