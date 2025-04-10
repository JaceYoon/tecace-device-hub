
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Device } from '@/types';
import { useDeviceStatus } from './hooks/useDeviceStatus';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, UserCheck, UserX, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { formatDate } from '@/utils/formatDate';

// Define the ownership history interface
interface OwnershipRecord {
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
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeviceHistoryDialog: React.FC<DeviceHistoryDialogProps> = ({ device, open, onOpenChange }) => {
  const [historyRecords, setHistoryRecords] = React.useState<OwnershipRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { getStatusBadge } = useDeviceStatus();
  
  // Fetch device history when the dialog opens
  React.useEffect(() => {
    const fetchHistory = async () => {
      if (open && device.id) {
        setLoading(true);
        try {
          const history = await dataService.getDeviceHistory(device.id);
          setHistoryRecords(history);
        } catch (error) {
          console.error('Failed to fetch device history:', error);
          toast.error('Could not load device history');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchHistory();
  }, [open, device.id]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ownership History</DialogTitle>
          <DialogDescription>
            View the complete ownership history for {device.project}
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4">
          <div className="rounded border p-4 mb-4">
            <h3 className="text-lg font-medium">{device.project}</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div>{getStatusBadge(device.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">{device.type}</Badge>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>No ownership history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium flex gap-2 items-center">
                        <UserCheck className="h-4 w-4" />
                        {record.userName}
                      </h4>
                      {record.assignedAt && (
                        <p className="text-sm text-muted-foreground">
                          Assigned: {formatDate(new Date(record.assignedAt))}
                        </p>
                      )}
                    </div>
                    
                    {record.releasedAt ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Released
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  {record.releasedAt && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-muted-foreground" />
                        <span>Released: {formatDate(new Date(record.releasedAt))}</span>
                      </div>
                      {record.releasedByName && (
                        <p className="text-muted-foreground ml-6">
                          by: {record.releasedByName}
                        </p>
                      )}
                      {record.releaseReason && (
                        <p className="text-muted-foreground mt-2">
                          Reason: {record.releaseReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;
