
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DeviceTypeValue } from '@/types';

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
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="stolen">Stolen</SelectItem>
            <SelectItem value="dead">Dead</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {deviceTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onSortChange && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No sorting</SelectItem>
              <SelectItem value="currentName">Current name</SelectItem>
              <SelectItem value="deviceName">Device name</SelectItem>
              <SelectItem value="receivedDate">Received date</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery || sortBy !== 'none') && (
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
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
              Sort: {sortBy === 'currentName' ? 'Current name' : 
                     sortBy === 'deviceName' ? 'Device name' : 
                     sortBy === 'receivedDate' ? 'Received date' : sortBy}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceFilters;
