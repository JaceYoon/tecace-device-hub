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
  
  const [effectiveStatusFilters, setEffectiveStatusFilters] = useState<string[] | undefined>(filterByStatus);
  
  const initialLogsDone = useRef(false);
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);

  const stableFilterByStatus = useRef(filterByStatus);
  
  useEffect(() => {
    const currentIsArray = Array.isArray(stableFilterByStatus.current);
    const newIsArray = Array.isArray(filterByStatus);
    
    let shouldUpdate = currentIsArray !== newIsArray;
    
    if (currentIsArray && newIsArray) {
      const current = stableFilterByStatus.current || [];
      const newVal = filterByStatus || [];
      shouldUpdate = current.length !== newVal.length || 
                     current.some((item, i) => item !== newVal[i]);
    }
    
    if (shouldUpdate) {
      stableFilterByStatus.current = filterByStatus;
    }
  }, [filterByStatus]);

  useEffect(() => {
    if (!initialLogsDone.current) {
      console.log('Initial filterByStatus:', filterByStatus);
      console.log('Initial filterByAssignedToUser:', filterByAssignedToUser);
      console.log('Initial filterByAvailable:', filterByAvailable);
      initialLogsDone.current = true;
    }
  }, [filterByStatus, filterByAssignedToUser, filterByAvailable]);

  const fetchData = useCallback(async () => {
    if (fetchInProgress.current) return;
    
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
      
      const assignedDevices = fetchedDevices.filter(d => d.assignedTo || d.assignedToId);
      console.log(`useDeviceFilters: Found ${assignedDevices.length} assigned devices`);
      
      setDevices(fetchedDevices);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching data for filters:', error);
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    if (stableFilterByStatus.current) {
      setEffectiveStatusFilters(stableFilterByStatus.current);
    } 
    else if (statusFilter === 'all') {
      setEffectiveStatusFilters(undefined);
    } else {
      setEffectiveStatusFilters([statusFilter]);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    
    const cleanupCallback = dataService.registerRefreshCallback(() => {
      setTimeout(() => {
        if (!fetchInProgress.current) {
          fetchData();
        }
      }, 500);
    });
    
    return () => {
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
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        (device.project && device.project.toLowerCase().includes(searchLower)) ||
        (device.projectGroup && device.projectGroup.toLowerCase().includes(searchLower)) ||
        (device.type && device.type.toLowerCase().includes(searchLower)) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchLower)) ||
        (device.imei && device.imei.toLowerCase().includes(searchLower)) ||
        (device.notes && device.notes.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      if (filterByAssignedToUser) {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        const userIdToMatch = String(filterByAssignedToUser);
        
        if (deviceAssignedTo !== userIdToMatch) {
          return false;
        }
      }
      
      if (effectiveStatusFilters && effectiveStatusFilters.length > 0) {
        if (!device.status || !effectiveStatusFilters.includes(device.status)) {
          return false;
        }
      }
      
      if (filterByAvailable && (device.status === 'returned' || device.status === 'dead')) {
        return false;
      }
      
      if (!effectiveStatusFilters && !filterByAvailable && device.status === 'returned') {
        return false;
      }
      
      if (typeFilter !== 'all' && device.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [devices, searchQuery, typeFilter, effectiveStatusFilters, filterByAssignedToUser, filterByAvailable]);

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
