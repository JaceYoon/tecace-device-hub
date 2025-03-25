
import React, { useState, useEffect } from 'react';
import { Device, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { dataService } from '@/services/data.service';
import { format } from 'date-fns';

interface OwnershipHistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string; // ISO date string
  releasedAt: string | null; // ISO date string
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

interface DeviceHistoryDialogProps {
  device: Device;
  users: User[];
}

export function DeviceHistoryDialog({ device, users }: DeviceHistoryDialogProps) {
  const [history, setHistory] = useState<OwnershipHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Make API call to get history
      const response = await fetch(`/api/devices/${device.id}/history`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched device history:', data);
        setHistory(data);
      } else {
        console.error('Failed to fetch device history:', response.statusText);
        // If API fails, try to create some history based on device info
        createFallbackHistory();
      }
    } catch (error) {
      console.error('Error fetching device history:', error);
      // If API fails, try to create some history based on device info
      createFallbackHistory();
    } finally {
      setLoading(false);
    }
  };

  // Create fallback history if API fails
  const createFallbackHistory = () => {
    const fallbackEntries: OwnershipHistoryEntry[] = [];
    
    // If device is assigned, add a current entry
    if (device.assignedTo) {
      const assignedUser = users.find(u => u.id === device.assignedTo);
      if (assignedUser) {
        fallbackEntries.push({
          id: `fallback-current-${device.id}`,
          deviceId: device.id,
          userId: device.assignedTo,
          userName: assignedUser.name,
          assignedAt: device.updatedAt?.toISOString() || new Date().toISOString(),
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
          releaseReason: null
        });
      }
    }
    
    console.log('Created fallback history:', fallbackEntries);
    setHistory(fallbackEntries);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, device.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Current owner';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs flex items-center gap-1"
        >
          <Clock className="h-3.5 w-3.5" />
          Ownership History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ownership History</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-semibold mb-2">{device.project} - {device.serialNumber || 'No S/N'}</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Clock className="h-6 w-6 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No ownership records found</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-6 pb-4">
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-2.5 top-2.5 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  {/* Timeline marker */}
                  <div className="absolute left-0 top-2 h-5 w-5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  
                  {/* Content */}
                  <div className="rounded-md border p-3">
                    <div className="font-medium">{entry.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      From: {formatDate(entry.assignedAt)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To: {formatDate(entry.releasedAt)}
                    </div>
                    {entry.releaseReason && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Reason: {entry.releaseReason}
                      </div>
                    )}
                    {entry.releasedByName && (
                      <div className="text-xs text-muted-foreground">
                        Released by: {entry.releasedByName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
