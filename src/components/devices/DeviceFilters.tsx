
import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { Search } from 'lucide-react';

interface DeviceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  deviceTypes: string[];
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  deviceTypes,
}) => {
  const { isAdmin, isManager } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, serial, IMEI, or notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select
        value={statusFilter}
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="pending">Request Pending</SelectItem>
          {(isAdmin || isManager) && (
            <>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
              <SelectItem value="dead">Dead</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      
      <Select
        value={typeFilter}
        onValueChange={onTypeChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {deviceTypes.map(type => {
            if (type === 'all') return null;
            return <SelectItem key={type} value={type}>{type}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DeviceFilters;
