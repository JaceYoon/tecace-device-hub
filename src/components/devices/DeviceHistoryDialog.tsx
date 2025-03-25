
import React, { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { dataService } from '@/services/data.service';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceHistoryProps {
  device: Device;
  users: User[];
}

interface HistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string;
  releasedAt: string | null;
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

export const DeviceHistoryDialog: React.FC<DeviceHistoryProps> = ({ device, users }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch history when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, device.id]);
  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      console.log(`Fetching history for device: ${device.id}`);
      // Use the correct method from dataService
      const data = await dataService.getDeviceHistory(device.id);
      
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Retrieved ${data.length} history entries`);
          setHistory(data);
        } else {
          console.log('No history data returned, creating fallback history');
          // Only create fallback history when there's truly no data
          const fallbackHistory = createFallbackHistory();
          if (fallbackHistory.length > 0) {
            setHistory(fallbackHistory);
          } else {
            setHistory([{
              id: `empty-${device.id}`,
              deviceId: device.id,
              userId: '',
              userName: 'No ownership records found',
              assignedAt: new Date().toISOString(),
              releasedAt: null,
              releasedById: null,
              releasedByName: null,
              releaseReason: null
            }]);
          }
        }
      } else {
        console.log('No data returned from API');
        createFallbackHistory();
      }
    } catch (error) {
      console.error('Error fetching device history:', error);
      createFallbackHistory();
    } finally {
      setLoading(false);
    }
  };
  
  // Create fallback history from device information if API fails
  const createFallbackHistory = (): HistoryEntry[] => {
    console.log('Creating fallback history from device data');
    const fallbackEntries: HistoryEntry[] = [];
    
    // Add current assignment if device is assigned
    if (device.assignedTo) {
      const assignedUser = users.find(u => u.id === device.assignedTo);
      if (assignedUser) {
        // Handle date conversion properly - updatedAt could be a string or a Date
        let assignedDate: string;
        if (typeof device.updatedAt === 'string') {
          assignedDate = device.updatedAt;
        } else if (device.updatedAt instanceof Date) {
          assignedDate = device.updatedAt.toISOString();
        } else {
          assignedDate = new Date().toISOString();
        }
            
        fallbackEntries.push({
          id: `fallback-current-${device.id}`,
          deviceId: device.id,
          userId: device.assignedTo,
          userName: assignedUser.name,
          assignedAt: assignedDate,
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
          releaseReason: null
        });
      }
    }
    
    setHistory(fallbackEntries);
    return fallbackEntries;
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Clock className="mr-2 h-4 w-4" />
          Ownership History
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ownership History</DialogTitle>
          <DialogDescription>
            Track who has used this device over time
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-semibold mb-2">{device.project} - {device.serialNumber || 'No S/N'}</h3>
          
          <div className="text-xs text-muted-foreground mb-3">
            <div className="flex gap-2 mt-1">
              <span className="font-medium">S/N:</span> {device.serialNumber || 'Not available'}
            </div>
            <div className="flex gap-2 mt-1">
              <span className="font-medium">IMEI:</span> {device.imei || 'Not available'}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No ownership history available</p>
                </div>
              ) : (
                history.map((entry, index) => {
                  // Check if this is the current owner (no releasedAt date)
                  const isCurrentOwner = entry.releasedAt === null;
                  
                  return (
                    <div key={entry.id || index} className="border rounded-md p-3">
                      <div className="font-semibold">
                        {entry.userName}
                        {isCurrentOwner && 
                          <span className="ml-2 text-sm text-primary">(Current Owner)</span>
                        }
                      </div>
                      
                      <div className="text-sm mt-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assigned:</span>
                          <span>{formatDate(entry.assignedAt)}</span>
                        </div>
                        
                        {!isCurrentOwner && (
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Returned:</span>
                            <span>{formatDate(entry.releasedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;
