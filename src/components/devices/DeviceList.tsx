import React from 'react';
import { useDeviceFilters } from '@/hooks/useDeviceFilters';
import DeviceFilters from './DeviceFilters';
import DeviceGrid from './DeviceGrid';
import DeviceListHeader from './DeviceListHeader';

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
                                                 statusFilter,
                                                 showControls = true,
                                                 showExportButton = true,
                                                 className,
                                                 refreshTrigger,
                                               }) => {
  const {
    users,
    filteredDevices,
    deviceTypes,
    searchQuery,
    setSearchQuery,
    statusFilter: internalStatusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    fetchData
  } = useDeviceFilters({
    filterByAvailable,
    filterByAssignedToUser,
    filterByStatus,
    refreshTrigger
  });

  // Set initial status filter if provided as prop
  React.useEffect(() => {
    if (statusFilter) {
      setStatusFilter(statusFilter);
    }
  }, [statusFilter]);

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
                statusFilter={internalStatusFilter}
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