
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image } from 'lucide-react';

interface DeviceImageUploaderProps {
  devicePicture?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  devicePicture,
  onFileChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="devicePicture-upload">Device Picture</Label>
      <div className="flex items-center gap-2">
        <Input
          id="devicePicture-upload"
          name="devicePicture-upload"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="flex-1"
          aria-label="Upload device picture"
        />
        <Image className="h-5 w-5 text-muted-foreground" />
      </div>
      {devicePicture && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-1">Current device picture:</p>
          <img 
            src={devicePicture} 
            alt="Device Picture" 
            className="max-w-full h-auto max-h-24 rounded border border-muted" 
          />
        </div>
      )}
    </div>
  );
};

export default DeviceImageUploader;
