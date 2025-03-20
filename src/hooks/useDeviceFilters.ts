
import { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';
import { useAuth } from '@/components/auth/AuthProvider';

interface UseDeviceFiltersProps {
  filterByAvailable?: boolean;
  filterByAssignedToUser?: string;
  filterByStatus?: string[];
  refreshTrigger?: number;
}

export const useDeviceFilters = (props: UseDeviceFiltersProps = {}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { isManager, isAdmin } = useAuth();

  // Get unique device types from the devices array
  const deviceTypes = ['all', ...new Set(
    devices.map(device => device.type)
      .filter(Boolean)
      .sort()
  )];

  // Fetch devices and users
  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesData, usersData] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);

      console.log("Fetched devices for useDeviceFilters:", devicesData);
      setDevices(devicesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [props.refreshTrigger]);

  // Filter devices based on filters
  const filteredDevices = devices.filter(device => {
    // For non-admin/manager users, always hide missing/stolen devices
    if (!isAdmin && !isManager && ['missing', 'stolen'].includes(device.status)) {
      return false;
    }

    // If specific status filter is provided via props
    if (props.filterByStatus && props.filterByStatus.length > 0) {
      if (!props.filterByStatus.includes(device.status)) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery && !device.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(device.imei && device.imei.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Filter by status dropdown
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        if (!device.requestedBy) return false;
      } else if (device.status !== statusFilter) {
        return false;
      }
    }

    // Filter by type
    if (typeFilter !== 'all' && device.type !== typeFilter) {
      return false;
    }

    // Filter by available only
    if (props.filterByAvailable && device.status !== 'available') {
      return false;
    }

    // Filter by assigned to user
    if (props.filterByAssignedToUser && device.assignedTo !== props.filterByAssignedToUser) {
      return false;
    }

    return true;
  });

  return {
    devices,
    users,
    filteredDevices,
    deviceTypes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    loading,
    fetchData
  };
};
