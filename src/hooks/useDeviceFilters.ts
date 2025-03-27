
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
  // Use a ref to track if a fetch is in progress to prevent duplicate requests
  const fetchInProgress = useRef(false);
  // Use a ref to store the last timestamp when fetch was called
  const lastFetchTime = useRef(0);

  // Stable version of filterByStatus
  const stableFilterByStatus = useRef(filterByStatus);
  
  // Update the ref when filterByStatus changes significantly (not on every render)
  useEffect(() => {
    // Only update if there's a meaningful difference
    const currentIsArray = Array.isArray(stableFilterByStatus.current);
    const newIsArray = Array.isArray(filterByStatus);
    
    let shouldUpdate = currentIsArray !== newIsArray;
    
    if (currentIsArray && newIsArray) {
      // Both are arrays, check contents
      const current = stableFilterByStatus.current || [];
      const newVal = filterByStatus || [];
      shouldUpdate = current.length !== newVal.length || 
                     current.some((item, i) => item !== newVal[i]);
    }
    
    if (shouldUpdate) {
      stableFilterByStatus.current = filterByStatus;
    }
  }, [filterByStatus]);

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
    // Prevent concurrent fetches that could cause loops
    if (fetchInProgress.current) return;
    
    // Debounce fetch operations to prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime.current < 500) {
      return;
    }
    lastFetchTime.current = now;
    
    try {
      fetchInProgress.current = true;
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
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  // Update effective status filters when statusFilter or filterByStatus changes
  useEffect(() => {
    // If filterByStatus is provided, always use that (for My Devices)
    if (stableFilterByStatus.current) {
      setEffectiveStatusFilters(stableFilterByStatus.current);
    } 
    // Otherwise, use the statusFilter dropdown selection
    else if (statusFilter === 'all') {
      setEffectiveStatusFilters(undefined);
    } else {
      setEffectiveStatusFilters([statusFilter]);
    }
    // Only depend on statusFilter and the stable ref (not the prop directly)
  }, [statusFilter]);

  // Fetch devices and users when refreshTrigger changes
  useEffect(() => {
    fetchData();
    
    // Set up a refresh callback with dataService
    const cleanupCallback = dataService.registerRefreshCallback(() => {
      // Use setTimeout to delay the refresh and prevent rapid successive calls
      setTimeout(() => {
        if (!fetchInProgress.current) {
          fetchData();
        }
      }, 500);
    });
    
    return () => {
      // Clean up the callback when the component unmounts
      cleanupCallback();
    };
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
        (device.imei && device.imei.toLowerCase().includes(searchLower)) ||
        (device.notes && device.notes.toLowerCase().includes(searchLower)); // Added notes to search
      
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
