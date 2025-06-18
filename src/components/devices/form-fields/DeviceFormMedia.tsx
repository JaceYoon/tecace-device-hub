
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
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('DeviceFormMedia: Image change event received', {
      fileName: e.target.files?.[0]?.name || 'No file',
      value: e.target.value,
      hasFiles: !!e.target.files?.length
    });
    onFileChange(e);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media</h3>
      
      <DeviceImageUploader
        devicePicture={devicePicture}
        deviceId={deviceId}
        onFileChange={handleImageChange}
        onImageUpdate={onImageUpdate}
      />
    </div>
  );
};

export default DeviceFormMedia;
