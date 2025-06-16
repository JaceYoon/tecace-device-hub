
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Device, User, DeviceTypeValue } from '@/types';
import { optimizedDeviceService, DeviceFilters, PaginatedResponse } from '@/services/api/optimizedDevice.service';
import { userService } from '@/services/api/user.service';
import { toast } from 'sonner';
import { debounce } from '@/utils/debounce';

interface UseOptimizedDeviceListOptions {
  initialFilters?: DeviceFilters;
  pageSize?: number;
  enableInfiniteScroll?: boolean;
}

export const useOptimizedDeviceList = ({
  initialFilters = {},
  pageSize = 50,
  enableInfiniteScroll = false
}: UseOptimizedDeviceListOptions = {}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filters state
  const [filters, setFilters] = useState<DeviceFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');

  // Refs for optimization
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Device types from current data
  const deviceTypes = useMemo(() => {
    const types = new Set<DeviceTypeValue>();
    devices.forEach(device => {
      if (device.type) {
        types.add(device.type as DeviceTypeValue);
      }
    });
    return Array.from(types);
  }, [devices]);

  // User ID to name mapping
  const userIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => {
      if (user.id) {
        map.set(String(user.id), user.name || '');
      }
    });
    return map;
  }, [users]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!mountedRef.current) return;
      
      const newFilters = { ...filters, search: query };
      setFilters(newFilters);
      await loadDevices(1, newFilters, false);
    }, 300),
    [filters]
  );

  // Load devices function
  const loadDevices = useCallback(async (
    page: number = 1,
    currentFilters: DeviceFilters = filters,
    append: boolean = false
  ) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response: PaginatedResponse<Device> = await optimizedDeviceService.getPagedDevices({
        ...currentFilters,
        page,
        limit: pageSize
      });

      if (!mountedRef.current) return;

      if (append && enableInfiniteScroll) {
        setDevices(prev => [...prev, ...response.data]);
      } else {
        setDevices(response.data);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices');
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [filters, pageSize, enableInfiniteScroll]);

  // Load users (cached)
  const loadUsers = useCallback(async () => {
    try {
      const fetchedUsers = await userService.getAll();
      if (mountedRef.current) {
        setUsers(fetchedUsers);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUsers();
    loadDevices(1, initialFilters);
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof DeviceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadDevices(1, newFilters, false);
  }, [filters, loadDevices]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    loadDevices(newPage, filters, false);
  }, [filters, loadDevices]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading && enableInfiniteScroll) {
      loadDevices(pagination.page + 1, filters, true);
    }
  }, [pagination, loading, enableInfiniteScroll, filters, loadDevices]);

  // Refresh data
  const refresh = useCallback(() => {
    loadDevices(1, filters, false);
  }, [filters, loadDevices]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const resetFilters: DeviceFilters = {};
    setFilters(resetFilters);
    setSearchQuery('');
    loadDevices(1, resetFilters, false);
  }, [loadDevices]);

  return {
    // Data
    devices,
    users,
    deviceTypes,
    userIdToNameMap,
    
    // State
    loading,
    error,
    pagination,
    
    // Filters
    filters,
    searchQuery,
    
    // Actions
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    loadMore,
    refresh,
    resetFilters,
    
    // Computed
    hasActiveFilters: Object.keys(filters).some(key => 
      filters[key as keyof DeviceFilters] && 
      filters[key as keyof DeviceFilters] !== 'all' && 
      filters[key as keyof DeviceFilters] !== ''
    )
  };
};
