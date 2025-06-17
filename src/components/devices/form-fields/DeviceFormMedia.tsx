
import React from 'react';
import DeviceImageUploader from './DeviceImageUploader';

interface DeviceFormMediaProps {
  devicePicture?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DeviceFormMedia: React.FC<DeviceFormMediaProps> = ({
  devicePicture,
  onFileChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media</h3>
      
      <DeviceImageUploader
        devicePicture={devicePicture}
        onFileChange={onFileChange}
      />
    </div>
  );
};

export default DeviceFormMedia;
