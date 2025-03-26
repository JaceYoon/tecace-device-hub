
import React, { useEffect, useCallback, useRef } from 'react';
import { useDeviceFilters } from '@/hooks/useDeviceFilters';
import DeviceFilters from './DeviceFilters';
import DeviceGrid from './DeviceGrid';
import DeviceListHeader from './DeviceListHeader';
import { useAuth } from '@/components/auth/AuthProvider';

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
  
  // Determine what statuses to filter by default - memoize this calculation
  const defaultFilterStatuses = filterByStatus 
    ? filterByStatus // Use provided filter status directly
    : undefined;  // Don't restrict by status for admins by default
  
  // Important: Set the user ID for filtering my devices correctly
  const effectiveUserFilter = filterByAssignedToUser || 
    (title === 'My Devices' && user ? String(user.id) : undefined);
  
  // If this is the My Devices view, always force status to be 'assigned'
  const forceAssignedStatus = title === 'My Devices' ? ['assigned'] : undefined;
  const effectiveStatusFilter = forceAssignedStatus || defaultFilterStatuses;
  
  // Debug log to see what's being used for filtering - only log once
  useEffect(() => {
    if (initialRenderRef.current) {
      console.log(`DeviceList "${title}" - User:`, user?.id);
      console.log(`DeviceList "${title}" - Effective filter:`, effectiveUserFilter);
      console.log(`DeviceList "${title}" - Status filter:`, effectiveStatusFilter);
      initialRenderRef.current = false;
    }
  }, [title, user?.id, effectiveUserFilter, effectiveStatusFilter]);
  
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
    fetchData
  } = useDeviceFilters({
    filterByAvailable,
    filterByAssignedToUser: effectiveUserFilter,
    filterByStatus: effectiveStatusFilter,
    refreshTrigger
  });

  // Only set initial status filter once after component mounts
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, setStatusFilter]);

  // Define a memoized onAction callback to prevent infinite loops
  const handleAction = useCallback(() => {
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
  }, [title, user, filteredDevices.length, effectiveUserFilter]);

  // If this is My Devices view, we always want to show the controls for device return
  const showReturnControls = title === 'My Devices';

  return (
    <div className={className}>
      <DeviceListHeader
        title={title}
        showExportButton={showExportButton}
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
        />
      )}

      <DeviceGrid
        devices={filteredDevices}
        users={users}
        onAction={handleAction}
        showReturnControls={showReturnControls}
      />
    </div>
  );
};

export default DeviceList;
