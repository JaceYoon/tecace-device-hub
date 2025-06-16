
import { Device, DeviceRequest, DeviceTypeValue } from '@/types';
import { apiCall } from './utils';

export interface DeviceFilters {
  search?: string;
  status?: string;
  type?: string;
  assignedToUser?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DeviceQueryOptions extends DeviceFilters {
  page?: number;
  limit?: number;
}

export const optimizedDeviceService = {
  // Paginated device fetching with server-side filtering
  getPagedDevices: (options: DeviceQueryOptions = {}): Promise<PaginatedResponse<Device>> => {
    const params = new URLSearchParams();
    
    // Pagination
    params.append('page', String(options.page || 1));
    params.append('limit', String(options.limit || 50));
    
    // Filters
    if (options.search) params.append('search', options.search);
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.type && options.type !== 'all') params.append('type', options.type);
    if (options.assignedToUser) params.append('assignedToUser', options.assignedToUser);
    if (options.sortBy && options.sortBy !== 'none') {
      params.append('sortBy', options.sortBy);
      params.append('sortOrder', options.sortOrder || 'asc');
    }
    
    return apiCall<PaginatedResponse<Device>>(`/devices/paged?${params.toString()}`);
  },

  // Optimized search with debouncing support
  searchDevices: (query: string, filters: DeviceFilters = {}): Promise<Device[]> => {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', '20'); // Limit search results
    
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    
    return apiCall<Device[]>(`/devices/search?${params.toString()}`);
  },

  // Get device statistics for dashboard
  getDeviceStats: (): Promise<{
    total: number;
    available: number;
    assigned: number;
    missing: number;
    stolen: number;
    dead: number;
    byType: Record<DeviceTypeValue, number>;
  }> => apiCall('/devices/stats'),

  // Bulk operations for large datasets
  bulkUpdateDevices: (deviceIds: string[], updates: Partial<Device>): Promise<{ success: boolean; updated: number }> =>
    apiCall('/devices/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ deviceIds, updates })
    }),

  // Export with server-side generation for large datasets
  exportDevices: (filters: DeviceFilters = {}): Promise<{ downloadUrl: string }> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    
    return apiCall(`/devices/export?${params.toString()}`, { method: 'POST' });
  }
};
