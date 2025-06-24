
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
  const [sortBy, setSortBy] = useState<string>('none');
  
  const [effectiveStatusFilters, setEffectiveStatusFilters] = useState<string[] | undefined>(filterByStatus);
  
  const initialLogsDone = useRef(false);
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const stableFilterByStatus = useRef(filterByStatus);
  
  // Optimized search query state management - no debouncing here since we handle it in the component
  const memoizedSearchQuery = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);
  
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

  // Memoize device types calculation
  const deviceTypes = useMemo(() => {
    const types = new Set<DeviceTypeValue>();
    devices.forEach(device => {
      if (device.type) {
        types.add(device.type as DeviceTypeValue);
      }
    });
    return Array.from(types);
  }, [devices]);

  // Create a map of user IDs to user names for quick lookup - memoized for performance
  const userIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => {
      if (user.id) {
        map.set(String(user.id), user.name || '');
      }
    });
    return map;
  }, [users]);

  // Pre-compute search index for better performance - only rebuild when devices or users change
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    devices.forEach(device => {
      const ownerId = String(device.assignedTo || device.assignedToId || '');
      const ownerName = userIdToNameMap.get(ownerId) || '';
      
      const searchableText = [
        device.project || '',
        device.projectGroup || '',
        device.type || '',
        device.serialNumber || '',
        device.imei || '',
        device.notes || '',
        ownerName
      ].join(' ').toLowerCase();
      
      index.set(device.id, searchableText);
    });
    return index;
  }, [devices, userIdToNameMap]);

  // Get owners for dropdown list - optimized
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
    
    return owners.sort((a, b) => a.name.localeCompare(b.name));
  }, [devices, userIdToNameMap]);

  // Optimized filtering with early returns and reduced iterations
  const filteredDevices = useMemo(() => {
    console.time('Device filtering');
    
    let filtered = devices;
    
    // Apply status filters first (most selective)
    if (effectiveStatusFilters && effectiveStatusFilters.length > 0) {
      filtered = filtered.filter(device => 
        device.status && effectiveStatusFilters.includes(device.status)
      );
    } else if (!effectiveStatusFilters && !filterByAvailable) {
      filtered = filtered.filter(device => device.status !== 'returned');
    }
    
    // Apply availability filter
    if (filterByAvailable) {
      filtered = filtered.filter(device => 
        device.status !== 'returned' && device.status !== 'dead'
      );
    }
    
    // Apply assigned user filter
    if (filterByAssignedToUser) {
      const userIdToMatch = String(filterByAssignedToUser);
      filtered = filtered.filter(device => {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        return deviceAssignedTo === userIdToMatch;
      });
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(device => device.type === typeFilter);
    }
    
    // Apply owner filter
    if (ownerFilter !== 'all') {
      filtered = filtered.filter(device => {
        const deviceAssignedTo = String(device.assignedTo || device.assignedToId || '');
        return deviceAssignedTo === ownerFilter;
      });
    }
    
    // Apply search filter using pre-computed index - only if search query exists
    if (memoizedSearchQuery) {
      filtered = filtered.filter(device => {
        const searchableText = searchIndex.get(device.id) || '';
        return searchableText.includes(memoizedSearchQuery);
      });
    }

    // Apply sorting with optimized comparison
    if (sortBy !== 'none') {
      const [sortField, sortOrder = 'asc'] = sortBy.split('-');
      
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortField) {
          case 'currentName': {
            const aOwnerId = String(a.assignedTo || a.assignedToId || '');
            const bOwnerId = String(b.assignedTo || b.assignedToId || '');
            aValue = userIdToNameMap.get(aOwnerId) || '';
            bValue = userIdToNameMap.get(bOwnerId) || '';
            break;
          }
          case 'deviceName': {
            aValue = a.project || '';
            bValue = b.project || '';
            break;
          }
          case 'receivedDate': {
            aValue = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
            bValue = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
            break;
          }
          default:
            return 0;
        }

        // For receivedDate, we want to sort by time value
        if (sortField === 'receivedDate') {
          const result = (bValue as number) - (aValue as number);
          return sortOrder === 'desc' ? result : -result;
        }

        // For string values
        const result = (aValue as string).localeCompare(bValue as string);
        return sortOrder === 'desc' ? -result : result;
      });
    }

    console.timeEnd('Device filtering');
    console.log(`Filtered ${devices.length} -> ${filtered.length} devices`);
    return filtered;
  }, [devices, memoizedSearchQuery, typeFilter, effectiveStatusFilters, filterByAssignedToUser, filterByAvailable, userIdToNameMap, ownerFilter, sortBy, searchIndex]);

  // Memoize the search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    devices,
    users,
    filteredDevices,
    deviceTypes,
    searchQuery,
    setSearchQuery: handleSearchChange,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    ownerFilter,
    setOwnerFilter,
    sortBy,
    setSortBy,
    fetchData,
    deviceOwners,
    userIdToNameMap
  };
};
