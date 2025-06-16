
import React, { useCallback } from 'react';
import { useOptimizedDeviceList } from '@/hooks/useOptimizedDeviceList';
import DeviceGrid from './DeviceGrid';
import DeviceFilters from './DeviceFilters';
import DeviceListHeader from './DeviceListHeader';
import { useAuth } from '@/hooks/auth/useAuth';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginatedDeviceListProps {
  title?: string;
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  showControls?: boolean;
  showExportButton?: boolean;
  className?: string;
  pageSize?: number;
}

const PaginatedDeviceList: React.FC<PaginatedDeviceListProps> = ({
  title = 'Devices',
  filterByAvailable = false,
  filterByAssignedToUser,
  filterByStatus,
  showControls = true,
  showExportButton = true,
  className,
  pageSize = 50,
}) => {
  const { isAdmin } = useAuth();
  
  const initialFilters = {
    ...(filterByAvailable && { status: 'available' }),
    ...(filterByAssignedToUser && { assignedToUser: filterByAssignedToUser }),
    ...(filterByStatus && filterByStatus.length === 1 && { status: filterByStatus[0] }),
  };

  const {
    devices,
    users,
    deviceTypes,
    loading,
    error,
    pagination,
    filters,
    searchQuery,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    refresh,
    resetFilters,
    hasActiveFilters
  } = useOptimizedDeviceList({
    initialFilters,
    pageSize
  });

  const handleAction = useCallback(() => {
    refresh();
  }, [refresh]);

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;
    
    // Always show first page
    if (page > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (page > 4) {
        items.push(<PaginationEllipsis key="ellipsis1" />);
      }
    }
    
    // Show pages around current page
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Always show last page
    if (page < totalPages - 2) {
      if (page < totalPages - 3) {
        items.push(<PaginationEllipsis key="ellipsis2" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  const showReturnControls = title === 'My Devices';

  return (
    <div className={className}>
      <DeviceListHeader
        title={title}
        showExportButton={showExportButton && isAdmin}
        devices={devices}
        users={users}
      />

      {showControls && (
        <DeviceFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={filters.status || 'all'}
          onStatusChange={(status) => handleFilterChange('status', status)}
          typeFilter={filters.type || 'all'}
          onTypeChange={(type) => handleFilterChange('type', type)}
          deviceTypes={deviceTypes}
          sortBy={filters.sortBy || 'none'}
          onSortChange={(sortBy) => handleFilterChange('sortBy', sortBy)}
        />
      )}

      {hasActiveFilters && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear all filters
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {loading && devices.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading devices...</span>
          </div>
        ) : (
          <div className="relative">
            <DeviceGrid
              devices={devices}
              users={users}
              onAction={handleAction}
              showReturnControls={showReturnControls}
            />
            
            {loading && devices.length > 0 && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} devices
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {generatePaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginatedDeviceList;
