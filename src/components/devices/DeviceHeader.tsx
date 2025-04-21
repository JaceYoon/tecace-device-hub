import React from 'react';
import { Smartphone } from 'lucide-react';
import { Device } from '@/types';
import { CardTitle, CardDescription } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import DeviceAdminMenu from './DeviceAdminMenu';
import { addYears, isAfter, parseISO } from 'date-fns';
import oldTagIcon from '@/assets/icons/device/old-device-tag.png';

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
  // Check if device is older than 1 year
  const isOldDevice = () => {
    if (!device.receivedDate) return false;
    
    const now = new Date();
    
    // Make sure receivedDate is a Date object
    const receivedDate = typeof device.receivedDate === 'string' 
      ? parseISO(device.receivedDate) 
      : device.receivedDate;
    
    // Calculate one year after received date
    const oneYearAfterReceived = addYears(receivedDate, 1);
    
    // Check if current date is after the one year mark
    return isAfter(now, oneYearAfterReceived);
  };

  // Only show old device tag if assigned and over 1 year old
  const showOldDeviceTag = device.status === 'assigned' && isOldDevice();

  return (
    <div className="flex justify-between items-start w-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <CardTitle className="text-lg font-medium leading-tight mr-2">
            {device.project}
          </CardTitle>
          {showOldDeviceTag && (
            <img 
              src={oldTagIcon} 
              alt="Old Device" 
              className="h-7 inline-block" 
              title="Device is over 1 year old"
            />
          )}
        </div>
        {device.projectGroup && (
          <div className="text-base text-muted-foreground">
            ({device.projectGroup})
          </div>
        )}
        <div className="mt-1">
          <CardDescription className="flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{device.type}</span>
          </CardDescription>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 ml-2">
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
