
import React from 'react';
import ExportButton from './ExportButton';
import { User, Device } from '@/types';

interface DeviceListHeaderProps {
  title: string;
  showExportButton: boolean;
  devices: Device[];
  users: User[];
}

const DeviceListHeader: React.FC<DeviceListHeaderProps> = ({
  title,
  showExportButton = true,
  devices,
  users
}) => {
  if (!title) return null;
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {showExportButton && devices.length > 0 && (
        <ExportButton 
          devices={devices} 
          users={users} 
          exportFileName={title.replace(/\s+/g, '_')}
        />
      )}
    </div>
  );
};

export default DeviceListHeader;
