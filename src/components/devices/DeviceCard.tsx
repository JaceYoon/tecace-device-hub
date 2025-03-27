
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Device } from '@/types/device';
import { Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DeviceCardProps {
  device: Device;
  onRequestDevice: (device: Device) => void;
  onViewDetails: (device: Device) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onRequestDevice, onViewDetails }) => {
  // Status color mapping
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-100 text-green-800 border-green-300',
    assigned: 'bg-blue-100 text-blue-800 border-blue-300',
    missing: 'bg-amber-100 text-amber-800 border-amber-300',
    stolen: 'bg-red-100 text-red-800 border-red-300',
  };

  // Handle image download
  const handleDownloadImage = () => {
    if (!device.devicePicture) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = device.devicePicture;
    link.download = `device-${device.id}-${device.project}.jpg`;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-start">
          <div>
            <span className="block">{device.project}</span>
            <span className="text-sm text-muted-foreground font-normal mt-1">{device.projectGroup}</span>
          </div>
          <Badge className={`ml-2 ${statusColorMap[device.status] || 'bg-gray-100 text-gray-800'}`}>
            {device.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div>
          <div className="grid grid-cols-2 gap-1 mb-4 text-sm">
            <div className="text-muted-foreground">Type:</div>
            <div className="font-medium">{device.type}</div>
            
            {device.imei && (
              <>
                <div className="text-muted-foreground">IMEI:</div>
                <div className="font-medium">{device.imei}</div>
              </>
            )}
            
            {device.serialNumber && (
              <>
                <div className="text-muted-foreground">Serial:</div>
                <div className="font-medium truncate" title={device.serialNumber}>
                  {device.serialNumber}
                </div>
              </>
            )}
            
            {device.receivedDate && (
              <>
                <div className="text-muted-foreground">Received:</div>
                <div className="font-medium">{formatDate(device.receivedDate)}</div>
              </>
            )}
            
            {device.assignedToName && (
              <>
                <div className="text-muted-foreground">Assigned to:</div>
                <div className="font-medium">{device.assignedToName}</div>
              </>
            )}
          </div>
          
          {device.devicePicture && (
            <div className="mb-4 overflow-hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <img 
                    src={device.devicePicture} 
                    alt="Device Picture" 
                    className="max-w-full h-auto max-h-24 rounded border border-muted cursor-pointer hover:opacity-80 transition-opacity" 
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                      <span>Device Picture - {device.project}</span>
                    </DialogTitle>
                    <DialogDescription>
                      View full-sized device image
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={device.devicePicture} 
                      alt="Device Picture" 
                      className="max-w-full max-h-[70vh] rounded" 
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={handleDownloadImage}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {device.notes && (
            <div className="text-sm mb-4">
              <div className="text-muted-foreground mb-1">Notes:</div>
              <div className="font-medium">{device.notes}</div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-2">
          <Button 
            onClick={() => onViewDetails(device)} 
            variant="outline" 
            className="flex-1"
          >
            Details
          </Button>
          
          {device.status === 'available' && !device.requestedBy && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => onRequestDevice(device)} 
                    variant="default" 
                    className="flex-1"
                  >
                    Request
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Request this device</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {device.requestedBy && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" disabled className="flex-1">
                    Pending
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This device has a pending request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
