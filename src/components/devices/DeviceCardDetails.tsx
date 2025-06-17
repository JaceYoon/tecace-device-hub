
import React from 'react';
import { Device, User } from '@/types';
import { Box, Calendar, Clock, FileText, Image, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { DeviceHistoryDialog } from './DeviceHistoryDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeviceCardDetailsProps {
  device: Device;
  requestedByUser?: User | undefined;
  isManager: boolean;
  isAdmin: boolean;
  users: User[];
  onDownloadImage: () => void;
}

const DeviceCardDetails: React.FC<DeviceCardDetailsProps> = ({
  device,
  requestedByUser,
  isManager,
  isAdmin,
  users,
  onDownloadImage
}) => {
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatReceivedDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-2 text-sm">
      {device.receivedDate && (
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Received Date</p>
            <p className="text-sm">{formatReceivedDate(device.receivedDate)}</p>
          </div>
        </div>
      )}

      {device.deviceType && (
        <div className="flex items-start">
          <Box className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="text-sm">{device.deviceType}</p>
          </div>
        </div>
      )}

      {device.modelNumber && (
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Model Number</p>
            <p className="text-sm">{device.modelNumber}</p>
          </div>
        </div>
      )}

      {device.notes && (
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Notes</p>
            <p className="text-sm">{device.notes}</p>
          </div>
        </div>
      )}

      {device.devicePicture && (
        <div className="flex items-start">
          <Image className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Device Picture</p>
            <div className="mt-1">
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
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={onDownloadImage}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      {requestedByUser && (
        <div className="flex items-start">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Requested by</p>
            <p className="text-sm">{requestedByUser.name}</p>
          </div>
        </div>
      )}

      <div className="flex items-start">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">Last updated</p>
          <p className="text-xs">{formatDate(device.updatedAt)}</p>
        </div>
      </div>
      
      {(isManager || isAdmin) && (
        <div className="mt-2 pt-2 border-t">
          <DeviceHistoryDialog device={device} users={users} />
        </div>
      )}
    </div>
  );
};

export default DeviceCardDetails;
