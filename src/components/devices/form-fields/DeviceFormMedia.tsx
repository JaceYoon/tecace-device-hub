
import React from 'react';
import DeviceImageUploader from './DeviceImageUploader';

interface DeviceFormMediaProps {
  devicePicture?: string;
  deviceId?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpdate?: () => void;
}

const DeviceFormMedia: React.FC<DeviceFormMediaProps> = ({
  devicePicture,
  deviceId,
  onFileChange,
  onImageUpdate
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media</h3>
      
      <DeviceImageUploader
        devicePicture={devicePicture}
        deviceId={deviceId}
        onFileChange={onFileChange}
        onImageUpdate={onImageUpdate}
      />
    </div>
  );
};

export default DeviceFormMedia;
