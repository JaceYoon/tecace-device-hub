
import React from 'react';
import { Smartphone, Clock } from 'lucide-react';
import { Device } from '@/types';
import { CardTitle, CardDescription } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import DeviceAdminMenu from './DeviceAdminMenu';

interface DeviceHeaderProps {
  device: Device;
  isAdmin: boolean;
  isRequested: boolean;
  onStatusChange: (status: 'missing' | 'stolen' | 'available' | 'dead') => void;
  onDelete: () => void;
  onAction?: () => void;
}

const DeviceHeader: React.FC<DeviceHeaderProps> = ({
  device,
  isAdmin,
  isRequested,
  onStatusChange,
  onDelete,
  onAction
}) => {
  const deviceTitle = device.projectGroup ? 
    `${device.projectGroup} (${device.project})` : 
    device.project;

  return (
    <div className="flex justify-between items-start">
      <div>
        <CardTitle className="text-lg font-medium">{deviceTitle}</CardTitle>
        <div className="mt-1">
          <CardDescription className="flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5" />
            {device.type}
          </CardDescription>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {isAdmin && (
          <DeviceAdminMenu 
            device={device}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onAction={onAction}
          />
        )}
        <StatusBadge status={device.status} />
        {isRequested && (
          <span className="text-xs text-amber-600 flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1" />
            Request Pending
          </span>
        )}
      </div>
    </div>
  );
};

export default DeviceHeader;
