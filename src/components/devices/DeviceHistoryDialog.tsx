
import React, { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { dataService } from '@/services/data.service';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

interface ConsolidatedHistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string;
  releasedAt: string | null;
  isCurrentOwner: boolean;
}

export const DeviceHistoryDialog: React.FC<DeviceHistoryProps> = ({ device, users }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ConsolidatedHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, device.id]);
  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      console.log(`Fetching history for device: ${device.id}`);
      const data = await dataService.getDeviceHistory(device.id);
      
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Retrieved ${data.length} history entries`);
          
          const processedHistory = processHistoryEntries(data);
          setHistory(processedHistory);
        } else {
          console.log('No history data returned, creating fallback history');
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
              isCurrentOwner: false
            }]);
          }
        }
      } else {
        console.log('No data returned from API');
        const fallbackHistory = createFallbackHistory();
        setHistory(fallbackHistory);
      }
    } catch (error) {
      console.error('Error fetching device history:', error);
      const fallbackHistory = createFallbackHistory();
      setHistory(fallbackHistory);
    } finally {
      setLoading(false);
    }
  };
  
  const processHistoryEntries = (entries: HistoryEntry[]): ConsolidatedHistoryEntry[] => {
    const entriesByUser = new Map<string, HistoryEntry[]>();
    
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = new Date(a.assignedAt || a.releasedAt || 0).getTime();
      const dateB = new Date(b.assignedAt || b.releasedAt || 0).getTime();
      return dateA - dateB;
    });
    
    sortedEntries.forEach(entry => {
      if (!entriesByUser.has(entry.userId)) {
        entriesByUser.set(entry.userId, []);
      }
      entriesByUser.get(entry.userId)!.push(entry);
    });
    
    const consolidatedEntries: ConsolidatedHistoryEntry[] = [];
    
    entriesByUser.forEach((userEntries, userId) => {
      const assignEntries = userEntries.filter(e => e.assignedAt);
      const releaseEntries = userEntries.filter(e => e.releasedAt);
      
      for (const assignEntry of assignEntries) {
        const matchingRelease = releaseEntries.find(release => 
          new Date(release.releasedAt!).getTime() > new Date(assignEntry.assignedAt).getTime()
        );
        
        const isCurrentOwner = device.assignedToId === userId && !matchingRelease;
        
        consolidatedEntries.push({
          id: `paired-${assignEntry.id}`,
          deviceId: device.id,
          userId: userId,
          userName: assignEntry.userName,
          assignedAt: assignEntry.assignedAt,
          releasedAt: matchingRelease ? matchingRelease.releasedAt : null,
          isCurrentOwner: isCurrentOwner
        });
      }
      
      for (const releaseEntry of releaseEntries) {
        const isAlreadyPaired = consolidatedEntries.some(entry => 
          entry.userId === userId && entry.releasedAt === releaseEntry.releasedAt
        );
        
        if (!isAlreadyPaired) {
          consolidatedEntries.push({
            id: `unpaired-${releaseEntry.id}`,
            deviceId: device.id,
            userId: userId,
            userName: releaseEntry.userName,
            assignedAt: releaseEntry.assignedAt || new Date(0).toISOString(),
            releasedAt: releaseEntry.releasedAt,
            isCurrentOwner: false
          });
        }
      }
    });
    
    if (device.assignedToId && !consolidatedEntries.some(entry => entry.isCurrentOwner)) {
      const currentUser = users.find(u => u.id === device.assignedToId);
      
      if (currentUser) {
        consolidatedEntries.push({
          id: `current-${device.id}`,
          deviceId: device.id,
          userId: device.assignedToId,
          userName: currentUser.name,
          assignedAt: device.updatedAt instanceof Date 
            ? device.updatedAt.toISOString() 
            : typeof device.updatedAt === 'string' ? device.updatedAt : new Date().toISOString(),
          releasedAt: null,
          isCurrentOwner: true
        });
      }
    }
    
    return consolidatedEntries.sort((a, b) => {
      if (a.isCurrentOwner) return -1;
      if (b.isCurrentOwner) return 1;
      
      const dateA = new Date(a.assignedAt).getTime();
      const dateB = new Date(b.assignedAt).getTime();
      return dateB - dateA;
    }).filter(entry => {
      const assignedDate = new Date(entry.assignedAt);
      if (assignedDate.getFullYear() < 1980) {
        return false;
      }
      return true;
    });
  };
  
  const createFallbackHistory = (): ConsolidatedHistoryEntry[] => {
    console.log('Creating fallback history from device data');
    const fallbackEntries: ConsolidatedHistoryEntry[] = [];
    
    if (device.assignedTo) {
      const assignedUser = users.find(u => u.id === device.assignedTo);
      if (assignedUser) {
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
          isCurrentOwner: true
        });
      }
    } else if (device.status === 'available') {
      fallbackEntries.push({
        id: `available-${device.id}`,
        deviceId: device.id,
        userId: '',
        userName: 'Available',
        assignedAt: new Date().toISOString(),
        releasedAt: null,
        isCurrentOwner: true
      });
    }
    
    return fallbackEntries;
  };
  
  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (date.getFullYear() < 1980) {
        return 'N/A';
      }
      return format(date, 'MMM d, yyyy');
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
      
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ownership History</DialogTitle>
          <DialogDescription>
            Track who has used this device over time
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto">
          <h3 className="font-semibold mb-2">{device.project}</h3>
          
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
              {device.status === 'available' && (
                <div className="border rounded-md p-3 bg-green-50/30">
                  <div className="font-semibold text-green-700">
                    Available
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">
                    This device is currently available for use
                  </div>
                </div>
              )}
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No ownership history available</p>
                </div>
              ) : (
                history.filter(entry => !(entry.userName === 'Available' && device.status === 'available')).map((entry) => (
                  <div 
                    key={entry.id} 
                    className={cn(
                      "border rounded-md p-3",
                      {
                        "bg-green-100 dark:bg-green-700": entry.isCurrentOwner // Changed from bg-green-50/30 to bg-green-100 for more noticeable color
                      }
                    )}
                  >
                    <div className="font-semibold">
                      {entry.userName}
                      {entry.isCurrentOwner && entry.userName !== 'Available' && 
                        <span className="ml-2 text-sm text-primary">(Current Owner)</span>
                      }
                    </div>
                    
                    <div className="text-sm mt-2">
                      {entry.userName !== 'Available' && (
                        <div>
                          <p className="text-muted-foreground mb-1">Rental Term:</p>
                          <p>
                            {formatDateOnly(entry.assignedAt)} - {entry.releasedAt 
                              ? formatDateOnly(entry.releasedAt) 
                              : 'Present'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceHistoryDialog;
