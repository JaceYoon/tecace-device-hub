import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { useDeviceFilters } from '@/hooks/useDeviceFilters';
import { usePagination } from '@/hooks/usePagination';
import DeviceFilters from './DeviceFilters';
import DeviceGrid from './DeviceGrid';
import DeviceListHeader from './DeviceListHeader';
import { useAuth } from '@/components/auth/AuthProvider';
import { PaginationControls } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceListProps {
  title?: string;
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  statusFilter?: string;
  showControls?: boolean;
  showExportButton?: boolean;
  className?: string;
  refreshTrigger?: number;
}

const DeviceList: React.FC<DeviceListProps> = ({
  title = 'Devices',
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
  statusFilter: initialStatusFilter,
  showControls = true,
  showExportButton = true,
  className,
  refreshTrigger,
}) => {
  const { user, isAdmin } = useAuth();
  const initialRenderRef = useRef(true);
  const hasSetInitialStatusRef = useRef(false);
  const lastActionTimeRef = useRef(0);
  
  // Memoize values that shouldn't change on every render
  // This is critical to prevent dependency changes in useEffect
  const effectiveUserFilter = useMemo(() => {
    return filterByAssignedToUser || 
      (title === 'My Devices' && user ? String(user.id) : undefined);
  }, [filterByAssignedToUser, title, user]);
  
  // If this is the My Devices view, always force status to be 'assigned'
  const effectiveStatusFilter = useMemo(() => {
    const forceAssignedStatus = title === 'My Devices' ? ['assigned'] : undefined;
    return forceAssignedStatus || filterByStatus;
  }, [title, filterByStatus]);
  
  // Debug log to see what's being used for filtering - only log once
  useEffect(() => {
    if (initialRenderRef.current && user) {
      console.log(`DeviceList "${title}" - User:`, user.id);
      console.log(`DeviceList "${title}" - Effective filter:`, effectiveUserFilter);
      console.log(`DeviceList "${title}" - Status filter:`, effectiveStatusFilter);
      initialRenderRef.current = false;
    }
  }, [title, user, effectiveUserFilter, effectiveStatusFilter]);
  
  const {
    users,
    filteredDevices,
    deviceTypes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    fetchData
  } = useDeviceFilters({
    filterByAvailable,
    filterByAssignedToUser: effectiveUserFilter,
    filterByStatus: effectiveStatusFilter,
    refreshTrigger
  });

  // Add pagination
  const pagination = usePagination({
    totalItems: filteredDevices.length,
    itemsPerPage: 20,
    initialPage: 1
  });

  // Get paginated devices
  const paginatedDevices = useMemo(() => {
    return filteredDevices.slice(pagination.startIndex, pagination.endIndex);
  }, [filteredDevices, pagination.startIndex, pagination.endIndex]);

  // Only set initial status filter once after component mounts
  useEffect(() => {
    if (initialStatusFilter && !hasSetInitialStatusRef.current) {
      setStatusFilter(initialStatusFilter);
      hasSetInitialStatusRef.current = true;
    }
  }, [initialStatusFilter, setStatusFilter]);

  // Define a memoized onAction callback to prevent infinite loops
  const handleAction = useCallback(() => {
    // Debounce the action to prevent multiple rapid calls
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500) {
      return;
    }
    lastActionTimeRef.current = now;
    
    // Use a timeout to prevent potential setState calls during React updates
    setTimeout(() => {
      fetchData();
    }, 300);
  }, [fetchData]);

  // Debug logs for "My Devices" view - only log once when filteredDevices changes
  useEffect(() => {
    if (title === 'My Devices' && user) {
      console.log("My Devices view - User ID:", user.id);
      console.log("My Devices view - Filtered devices count:", filteredDevices.length);
      console.log("My Devices view - All filtered devices:", filteredDevices);
      console.log("My Devices view - Filter by assigned user:", effectiveUserFilter);
    }
  }, [title, user, filteredDevices.length, effectiveUserFilter, filteredDevices]);

  // If this is My Devices view, we always want to show the controls for device return
  const showReturnControls = title === 'My Devices';

  return (
    <div className={className}>
      <DeviceListHeader
        title={title}
        showExportButton={showExportButton && isAdmin}
        devices={filteredDevices}
        users={users}
      />

      {showControls && (
        <DeviceFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          deviceTypes={deviceTypes}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {/* Pagination info and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {pagination.startIndex + 1} to {pagination.endIndex} of {pagination.totalItems} devices
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={pagination.itemsPerPage.toString()}
            onValueChange={(value) => pagination.setItemsPerPage(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DeviceGrid
        devices={paginatedDevices}
        users={users}
        onAction={handleAction}
        showReturnControls={showReturnControls}
      />

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
          />
        </div>
      )}
    </div>
  );
};

export default DeviceList;
