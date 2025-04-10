
import React from 'react';
import DeviceImageUploader from './form-fields/DeviceImageUploader';
import NotesField from './form-fields/NotesField';

interface DeviceFormMediaProps {
  devicePicture?: string;
  notes: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const DeviceFormMedia: React.FC<DeviceFormMediaProps> = ({
  devicePicture,
  notes,
  onFileChange,
  handleChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media & Notes</h3>
      
      <DeviceImageUploader
        devicePicture={devicePicture}
        onFileChange={onFileChange}
      />

      <NotesField
        notes={notes}
        handleChange={handleChange}
      />
    </div>
  );
};

export default DeviceFormMedia;
