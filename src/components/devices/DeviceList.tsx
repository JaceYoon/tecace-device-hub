import React, { useEffect, useCallback, useRef, useMemo } from 'react';
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
  showAddButton?: boolean;
  showFilterBar?: boolean;
  showManagementLink?: boolean;
  limit?: number;
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
  showAddButton,
  showFilterBar = true,
  showManagementLink,
  limit,
}) => {
  const { user, isAdmin } = useAuth();
  const initialRenderRef = useRef(true);
  const hasSetInitialStatusRef = useRef(false);
  const lastActionTimeRef = useRef(0);
  
  const effectiveUserFilter = useMemo(() => {
    return filterByAssignedToUser || 
      (title === 'My Devices' && user ? String(user.id) : undefined);
  }, [filterByAssignedToUser, title, user]);
  
  const effectiveStatusFilter = useMemo(() => {
    const forceAssignedStatus = title === 'My Devices' ? ['assigned'] : undefined;
    return forceAssignedStatus || filterByStatus;
  }, [title, filterByStatus]);
  
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
    refreshData
  } = useDeviceFilters({
    filterByAvailable,
    filterByAssignedToUser: effectiveUserFilter,
    filterByStatus: effectiveStatusFilter,
    refreshTrigger
  });

  useEffect(() => {
    if (initialStatusFilter && !hasSetInitialStatusRef.current) {
      setStatusFilter(initialStatusFilter);
      hasSetInitialStatusRef.current = true;
    }
  }, [initialStatusFilter, setStatusFilter]);

  const handleAction = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500) {
      return;
    }
    lastActionTimeRef.current = now;
    
    setTimeout(() => {
      refreshData();
    }, 300);
  }, [refreshData]);

  useEffect(() => {
    if (title === 'My Devices' && user) {
      console.log("My Devices view - User ID:", user.id);
      console.log("My Devices view - Filtered devices count:", filteredDevices.length);
      console.log("My Devices view - All filtered devices:", filteredDevices);
      console.log("My Devices view - Filter by assigned user:", effectiveUserFilter);
    }
  }, [title, user, filteredDevices.length, effectiveUserFilter, filteredDevices]);

  const showReturnControls = title === 'My Devices';

  const displayedDevices = limit && filteredDevices.length > limit 
    ? filteredDevices.slice(0, limit) 
    : filteredDevices;

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
        devices={displayedDevices}
        users={users}
        onAction={handleAction}
        showReturnControls={showReturnControls}
      />
    </div>
  );
};

export default DeviceList;
