import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { Device } from '@/types';

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  deviceName: string;
}

// Dialog to display a full-sized device image
export const ImageDialog: React.FC<ImageDialogProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  deviceName 
}) => {
  const handleDownload = () => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Set the download name using the device name
    link.download = `${deviceName.replace(/\s+/g, '-').toLowerCase()}-image.png`;
    
    // Set the href to the image URL
    link.href = imageUrl;
    
    // Append to the document
    document.body.appendChild(link);
    
    // Trigger the click event
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-lg">
        <div className="relative p-2 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 absolute top-2 right-2 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          <img 
            src={imageUrl} 
            alt="Device full view" 
            className="w-full h-auto object-contain rounded" 
          />
        </div>
        
        <DialogFooter className="p-4 flex justify-center">
          <Button 
            variant="outline"
            className="ml-4 gap-2" 
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component for the device history dialog
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dataService } from '@/services/data.service';
import { useAsync } from '@/hooks/useAsync';
import { toast } from 'sonner';
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DeviceHistoryDialogProps {
  deviceId: string;
  deviceName: string;
  devicePicture?: string;
}

interface HistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: Date | null;
  releasedAt: Date | null;
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

const DeviceHistoryDialog: React.FC<DeviceHistoryDialogProps> = ({ deviceId, deviceName, devicePicture }) => {
  const [open, setOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  
  const {
    data: history,
    loading,
    error,
    run,
  } = useAsync<HistoryEntry[]>([]);
  
  React.useEffect(() => {
    if (deviceId) {
      run(dataService.getDeviceHistory(deviceId));
    }
  }, [deviceId, run]);
  
  React.useEffect(() => {
    if (error) {
      toast.error(`Error fetching device history: ${error}`);
    }
  }, [error]);
  
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open && deviceId) {
      run(dataService.getDeviceHistory(deviceId));
    }
  };
  
  const handleImageClick = () => {
    setIsImageOpen(true);
  };
  
  const handleImageClose = () => {
    setIsImageOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Device History</DialogTitle>
          <DialogDescription>
            History of assignments and releases for {deviceName}.
          </DialogDescription>
        </DialogHeader>
        
        {devicePicture && (
          <div className="mb-4 cursor-pointer" onClick={handleImageClick}>
            <img 
              src={devicePicture} 
              alt="Device" 
              className="max-w-full h-auto max-h-48 rounded shadow-md" 
            />
          </div>
        )}
        
        <ImageDialog 
          isOpen={isImageOpen} 
          onClose={handleImageClose} 
          imageUrl={devicePicture || ''} 
          deviceName={deviceName} 
        />
        
        <Table>
          <TableCaption>A history of assignments and releases for this device.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead>Released At</TableHead>
              <TableHead>Released By</TableHead>
              <TableHead>Release Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading history...</TableCell>
              </TableRow>
            )}
            {history && history.length > 0 ? (
              history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.userName}</TableCell>
                  <TableCell>
                    {row.assignedAt ? format(new Date(row.assignedAt), "MMM d, yyyy h:mm a") : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {row.releasedAt ? format(new Date(row.releasedAt), "MMM d, yyyy h:mm a") : 'N/A'}
                  </TableCell>
                  <TableCell>{row.releasedByName || 'N/A'}</TableCell>
                  <TableCell>{row.releaseReason || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No history found for this device.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;
