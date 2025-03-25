
import React, { useEffect } from 'react';
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
  
  // Determine what statuses to filter by default
  const defaultFilterStatuses = filterByStatus 
    ? filterByStatus // Use provided filter status directly
    : undefined;  // Don't restrict by status for admins by default
  
  // Important: Set the user ID for filtering my devices correctly
  const effectiveUserFilter = filterByAssignedToUser || 
    (title === 'My Devices' && user ? user.id : undefined);
  
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
    filterByStatus: defaultFilterStatuses,
    refreshTrigger
  });

  // Set initial status filter if provided as prop
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, setStatusFilter]);

  // Debug logs for "My Devices" view
  if (title === 'My Devices' && user) {
    console.log("My Devices view - User ID:", user.id);
    console.log("My Devices view - Filtered devices:", filteredDevices);
    console.log("My Devices view - Filter by assigned user:", effectiveUserFilter);
  }

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
        onAction={fetchData}
      />
    </div>
  );
};

export default DeviceList;
