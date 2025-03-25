
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DeviceCardImageProps {
  image?: string;
  deviceName: string;
  isCollapsed: boolean;
}

const DeviceCardImage: React.FC<DeviceCardImageProps> = ({
  image,
  deviceName,
  isCollapsed
}) => {
  const [showImageDialog, setShowImageDialog] = useState(false);

  if (!image || !isCollapsed) return null;

  const downloadImage = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = `device-${deviceName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mt-2">
        <img 
          src={image} 
          alt={`${deviceName} picture`} 
          className="w-full h-auto rounded cursor-pointer border border-muted"
          onClick={() => setShowImageDialog(true)}
        />
      </div>

      {/* Full size image dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl">
          <div className="flex flex-col items-center">
            <img
              src={image}
              alt={`${deviceName} full size`}
              className="max-w-full h-auto"
            />
            <div className="flex justify-end w-full mt-4">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={downloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeviceCardImage;
