
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services/data.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, ClockIcon, Download, History, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportToExcel } from '@/utils/exportUtils'; // Fixed import
import { formatDistanceToNow } from 'date-fns';

interface DeviceHistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string | null;
  releasedAt: string | null;
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

interface DeviceHistoryDialogProps {
  deviceId: string;
  deviceName: string;
  trigger?: React.ReactNode;
  device?: any; // For backward compatibility
  users?: any[]; // For backward compatibility
}

const DeviceHistoryDialog: React.FC<DeviceHistoryDialogProps> = ({ 
  deviceId, 
  deviceName,
  trigger,
  device, // For backward compatibility
  users  // For backward compatibility
}) => {
  // Handle backward compatibility
  const effectiveDeviceId = deviceId || (device?.id || '');
  const effectiveDeviceName = deviceName || (device?.project || '');
  
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  
  const fetchHistory = async () => {
    if (!effectiveDeviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await dataService.getDeviceHistory(effectiveDeviceId);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching device history:', err);
      setError('Failed to load device history');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [effectiveDeviceId, open]);
  
  const handleExport = () => {
    if (history.length === 0) return;
    
    // Transform data for export
    const exportData = history.map(entry => ({
      DeviceID: effectiveDeviceId,
      DeviceName: effectiveDeviceName,
      UserName: entry.userName,
      AssignedDate: entry.assignedAt ? new Date(entry.assignedAt).toLocaleString() : '',
      ReleasedDate: entry.releasedAt ? new Date(entry.releasedAt).toLocaleString() : '',
      ReleasedBy: entry.releasedByName || '',
      ReleaseReason: entry.releaseReason || ''
    }));
    
    exportToExcel(exportData, `device-history-${effectiveDeviceId}`);
  };
  
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <History className="h-4 w-4" />
    </Button>
  );
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Device Ownership History</DialogTitle>
          <DialogDescription>
            View ownership history for device: {effectiveDeviceName}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={fetchHistory}
            >
              Retry
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No history records found for this device.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] -mx-6 px-6">
            <div className="relative">
              <div className="absolute left-[22px] top-0 bottom-0 w-[2px] bg-border/50" />
              
              {history.map((entry, index) => (
                <div key={entry.id} className="flex mb-6 relative">
                  <div className="mr-4 pt-1">
                    {entry.releasedAt ? (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${entry.userId}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {entry.userName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">
                          {entry.releasedAt ? 'Released' : 'Assigned to'} {entry.userName}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {entry.releasedAt 
                            ? `Released ${formatDistanceToNow(new Date(entry.releasedAt), { addSuffix: true })}`
                            : `Assigned ${formatDistanceToNow(new Date(entry.assignedAt!), { addSuffix: true })}`
                          }
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {entry.releasedAt ? new Date(entry.releasedAt).toLocaleDateString() : new Date(entry.assignedAt!).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {entry.releasedAt && (
                      <div className="mt-2 text-sm">
                        {entry.releasedByName && (
                          <p className="text-xs text-muted-foreground">Released by: {entry.releasedByName}</p>
                        )}
                        {entry.releaseReason && (
                          <p className="text-xs mt-1 bg-muted p-2 rounded">
                            Reason: {entry.releaseReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Moved download button to the bottom */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={history.length === 0}
          >
            <Download className="h-4 w-4" />
            Download History
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;
