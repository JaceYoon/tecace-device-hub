
import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DeviceTypeValue } from '@/types';
import { useAuth } from '@/hooks/auth/useAuth';

interface DeviceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  deviceTypes: DeviceTypeValue[];
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  deviceTypes,
  sortBy = 'none',
  onSortChange
}) => {
  const { isAdmin } = useAuth();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isOpen, setIsOpen] = useState(false);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(value);
  }, [onSearchChange]);

  const handleSortChange = useCallback((field: string) => {
    if (onSortChange) {
      const sortValue = field === 'none' ? 'none' : `${field}-${sortOrder}`;
      onSortChange(sortValue);
    }
  }, [onSortChange, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    if (sortBy !== 'none' && onSortChange) {
      const currentField = sortBy.split('-')[0];
      onSortChange(`${currentField}-${newOrder}`);
    }
  }, [sortOrder, sortBy, onSortChange]);

  const clearAllFilters = useCallback(() => {
    onSearchChange('');
    onStatusChange('all');
    onTypeChange('all');
    if (onSortChange) {
      onSortChange('none');
    }
    setSortOrder('asc');
  }, [onSearchChange, onStatusChange, onTypeChange, onSortChange]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'none';

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <DebouncedInput
            placeholder="Search devices... (실시간 검색)"
            value={searchQuery}
            onChange={handleSearchChange}
            debounceMs={150}
            className="pl-10"
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="px-3">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters & Sort</h4>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <Separator />
              
              {/* Filters Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Filters</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                      {isAdmin && (
                        <>
                          <SelectItem value="missing">Missing</SelectItem>
                          <SelectItem value="stolen">Stolen</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={typeFilter} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {deviceTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Sort Section */}
              {onSortChange && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Sort</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSortOrder}
                      className="h-6 px-2"
                    >
                      {sortOrder === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      <span className="text-xs ml-1">
                        {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Sort by</Label>
                    <Select 
                      value={sortBy === 'none' ? 'none' : sortBy.split('-')[0]} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sorting</SelectItem>
                        <SelectItem value="currentName">Current owner</SelectItem>
                        <SelectItem value="deviceName">Device name</SelectItem>
                        <SelectItem value="receivedDate">Received date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Search: {searchQuery}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter}
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Type: {typeFilter}
            </Badge>
          )}
          {sortBy !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              Sort: {sortBy.split('-')[0] === 'currentName' ? 'Current owner' : 
                     sortBy.split('-')[0] === 'deviceName' ? 'Device name' : 
                     sortBy.split('-')[0] === 'receivedDate' ? 'Received date' : sortBy.split('-')[0]} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceFilters;
