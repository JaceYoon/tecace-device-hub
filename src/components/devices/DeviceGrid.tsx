
import React from 'react';
import { Device, User } from '@/types';
import DeviceCard from './DeviceCard';

interface DeviceGridProps {
  devices: Device[];
  users: User[];
  onAction: () => void;
}

const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, users, onAction }) => {
  if (devices.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-muted/10">
        <p className="text-lg text-muted-foreground">No devices found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }
  
  // Add debugging info
  console.log("DeviceGrid - Rendering devices:", devices.length);
  console.log("DeviceGrid - First few devices:", devices.slice(0, 3));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map(device => (
        <DeviceCard 
          key={device.id} 
          device={device} 
          users={users}
          onAction={onAction}
        />
      ))}
    </div>
  );
};

export default DeviceGrid;
