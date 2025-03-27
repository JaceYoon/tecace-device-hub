
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DeviceImageViewerProps {
  imageUrl?: string;
  deviceName: string;
  onDownload: () => void;
}

const DeviceImageViewer: React.FC<DeviceImageViewerProps> = ({ 
  imageUrl, 
  deviceName,
  onDownload
}) => {
  if (!imageUrl) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No image available for this device
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 flex justify-center">
        <img 
          src={imageUrl} 
          alt={`${deviceName} Device Picture`} 
          className="max-w-full max-h-[70vh] rounded" 
        />
      </div>
      
      <div className="mt-2 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDownload}
          className="flex items-center gap-1"
          disabled={!imageUrl}
        >
          <Download className="h-4 w-4" />
          Download Image
        </Button>
      </div>
    </>
  );
};

export default DeviceImageViewer;
