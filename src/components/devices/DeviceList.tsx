
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
  const { isAdmin } = useAuth();
  
  // Determine what statuses to filter by default
  const defaultFilterStatuses = filterByStatus 
    ? filterByStatus // Use provided filter status directly
    : undefined;  // Don't restrict by status for admins by default
  
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
    filterByAssignedToUser,
    filterByStatus: defaultFilterStatuses,
    refreshTrigger
  });

  // Set initial status filter if provided as prop
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, setStatusFilter]);

  console.log(
    `DeviceList: Filtered ${filteredDevices.length} devices, ` +
    `filterByStatus=${JSON.stringify(filterByStatus)}, ` +
    `statusFilter=${statusFilter}, ` +
    `isAdmin=${isAdmin}`
  );

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
