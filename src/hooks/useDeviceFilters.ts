
import { useState, useEffect, useMemo } from 'react';
import { Device, User } from '@/types';

interface UseDeviceFiltersProps {
  devices: Device[];
  users: User[];
}

export const useDeviceFilters = ({ devices, users }: UseDeviceFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Extract unique device types for filter dropdown
  const deviceTypes = useMemo(() => {
    const types = devices
      .map(device => device.type)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['all', ...types];
  }, [devices]);

  // Filter devices based on search query, status, and type
  const filteredDevices = useMemo(() => {
    if (!devices) return [];

    return devices.filter(device => {
      // Apply search filter (case insensitive)
      const matchesSearch =
        searchQuery === '' ||
        device.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.serialNumber && device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.imei && device.imei.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.notes && device.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Apply status filter
      let matchesStatus = statusFilter === 'all';
      
      if (statusFilter === 'available') {
        matchesStatus = device.status === 'available';
      } else if (statusFilter === 'assigned') {
        matchesStatus = device.status === 'assigned';
      } else if (statusFilter === 'pending') {
        matchesStatus = !!device.requestedBy;
      } else if (statusFilter === 'missing') {
        matchesStatus = device.status === 'missing';
      } else if (statusFilter === 'stolen') {
        matchesStatus = device.status === 'stolen';
      }
      
      // Apply type filter
      const matchesType = typeFilter === 'all' || device.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchQuery, statusFilter, typeFilter]);

  return {
    filteredDevices,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deviceTypes
  };
};
