
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
  showControls?: boolean;
  showExportButton?: boolean;
  className?: string;
}

const DeviceList: React.FC<DeviceListProps> = ({
  title = 'Devices',
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
  showControls = true,
  showExportButton = true,
  className,
}) => {
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
    filterByStatus
  });
  
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
