
import React from 'react';
import { Device, User } from '@/types';
import DeviceCard from './DeviceCard';
import { Clock } from 'lucide-react';

interface DeviceGridProps {
  devices: Device[];
  users: User[];
  onAction?: () => void;
  showReturnControls?: boolean;
}

const DeviceGrid: React.FC<DeviceGridProps> = ({ 
  devices, 
  users, 
  onAction,
  showReturnControls = false
}) => {
  if (devices.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-muted/10">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
        <p className="text-lg font-medium text-muted-foreground">No devices found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or check back later</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
      {devices.map(device => (
        <div key={device.id} className="flex">
          <DeviceCard 
            device={device} 
            users={users} 
            onAction={onAction}
            className="w-full"
            showReturnControls={showReturnControls}
          />
        </div>
      ))}
    </div>
  );
};

export default DeviceGrid;
