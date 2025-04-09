
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
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  
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

  // Create a map of user IDs to user names for quick lookup
  const userIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => {
      if (user.id) {
        map.set(user.id, user.name || '');
      }
    });
    return map;
  }, [users]);

  // Get owners for dropdown list
  const deviceOwners = useMemo(() => {
    const ownerIds = new Set<string>();
    const owners: { id: string; name: string }[] = [];
    
    devices.forEach(device => {
      if (device.assignedTo || device.assignedToId) {
        const ownerId = String(device.assignedTo || device.assignedToId || '');
        if (ownerId && !ownerIds.has(ownerId)) {
          const ownerName = userIdToNameMap.get(ownerId) || 'Unknown User';
          owners.push({ id: ownerId, name: ownerName });
          ownerIds.add(ownerId);
        }
      }
    });
    
    return owners;
  }, [devices, userIdToNameMap]);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const searchLower = searchQuery.toLowerCase();
      
      // Get the owner name for this device if it exists
      let ownerName = '';
      if (device.assignedTo || device.assignedToId) {
        const ownerId = String(device.assignedTo || device.assignedToId || '');
        ownerName = userIdToNameMap.get(ownerId) || '';
      }

      // Check if device matches search query in any field including owner's name
      const matchesSearch = searchQuery === '' || 
        (device.project && device.project.toLowerCase().includes(searchLower)) ||
        (device.projectGroup && device.projectGroup.toLowerCase().includes(searchLower)) ||
        (device.type && device.type.toLowerCase().includes(searchLower)) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchLower)) ||
        (device.imei && device.imei.toLowerCase().includes(searchLower)) ||
        (device.notes && device.notes.toLowerCase().includes(searchLower)) ||
        (ownerName && ownerName.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      // Filter by assigned user if specified
      if (filterByAssignedToUser) {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        const userIdToMatch = String(filterByAssignedToUser);
        
        if (deviceAssignedTo !== userIdToMatch) {
          return false;
        }
      }
      
      // Filter by specific status if provided
      if (effectiveStatusFilters && effectiveStatusFilters.length > 0) {
        if (!device.status || !effectiveStatusFilters.includes(device.status)) {
          return false;
        }
      }
      
      // Additional filters
      if (filterByAvailable && (device.status === 'returned' || device.status === 'dead')) {
        return false;
      }
      
      if (!effectiveStatusFilters && !filterByAvailable && device.status === 'returned') {
        return false;
      }
      
      if (typeFilter !== 'all' && device.type !== typeFilter) {
        return false;
      }
      
      // Filter by owner if not "all"
      if (ownerFilter !== 'all') {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        if (deviceAssignedTo !== ownerFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [devices, searchQuery, typeFilter, effectiveStatusFilters, filterByAssignedToUser, filterByAvailable, userIdToNameMap, ownerFilter]);

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
    ownerFilter,
    setOwnerFilter,
    fetchData,
    deviceOwners,
    userIdToNameMap
  };
};
