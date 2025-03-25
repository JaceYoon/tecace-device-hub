
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
  const { isManager, isAdmin, user } = useAuth();

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
      console.log("useDeviceFilters - Fetching data...");
      const [devicesData, usersData] = await Promise.all([
        dataService.getDevices(),
        dataService.getUsers()
      ]);

      console.log("useDeviceFilters - Devices fetched:", devicesData.length);
      console.log("useDeviceFilters - Users fetched:", usersData.length);
      
      // Debug for My Devices filtering
      if (props.filterByAssignedToUser) {
        console.log("useDeviceFilters - Filtering by assignedTo:", props.filterByAssignedToUser);
        
        // Enhanced debugging - log all devices with their assignment information
        devicesData.forEach(d => {
          console.log(`Device ${d.id}: ${d.project} - assignedTo: ${d.assignedTo}, assignedToId: ${d.assignedToId}`);
        });
        
        // Check for both assignedTo and assignedToId that match the user
        const userDevices = devicesData.filter(d => {
          const assignedToMatch = String(d.assignedTo) === String(props.filterByAssignedToUser);
          const assignedToIdMatch = String(d.assignedToId) === String(props.filterByAssignedToUser);
          
          return assignedToMatch || assignedToIdMatch;
        });
        
        console.log("useDeviceFilters - Devices assigned to user:", userDevices.length);
        console.log("useDeviceFilters - Matching devices:", userDevices);
      }
      
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
      // For 'pending' status, include devices with requestedBy value
      if (props.filterByStatus.includes('pending')) {
        if (device.requestedBy || props.filterByStatus.includes(device.status)) {
          return true;
        }
        return false;
      } else if (!props.filterByStatus.includes(device.status)) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery && !device.project.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!device.serialNumber || !device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !(device.imei && device.imei.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Filter by status dropdown
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // If filtering for pending devices, show devices with requestedBy value
        if (!device.requestedBy) return false;
      } else if (device.status !== statusFilter) {
        return false;
      }
    }

    // Filter by type
    if (typeFilter !== 'all' && device.type !== typeFilter) {
      return false;
    }

    // Filter by available only - but exclude devices with pending requests
    if (props.filterByAvailable && (device.status !== 'available' || device.requestedBy)) {
      return false;
    }

    // Filter by assigned to user - check if the device is assigned to the specified user
    if (props.filterByAssignedToUser) {
      const userIdToFilter = String(props.filterByAssignedToUser);
      const deviceAssignedTo = device.assignedTo ? String(device.assignedTo) : null;
      const deviceAssignedToId = device.assignedToId ? String(device.assignedToId) : null;
      
      console.log(`Checking device ${device.id} (${device.project}): assignedTo=${deviceAssignedTo}, assignedToId=${deviceAssignedToId} against userId=${userIdToFilter}`);
      
      // Check both assignedTo and assignedToId fields to handle different formats
      return deviceAssignedTo === userIdToFilter || deviceAssignedToId === userIdToFilter;
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
