
import React, { useState } from 'react';
import { Device, User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown, ChevronRight, Cpu, Hash, Smartphone, Trash2, User as UserIcon } from 'lucide-react';
import { dataStore } from '@/utils/mockData';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DeviceCardProps {
  device: Device;
  onAction?: () => void;
  users?: User[];
  className?: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onAction, users = [], className }) => {
  const { user, isManager } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  const isDeviceOwner = device.assignedTo === user?.id;
  const hasRequested = device.requestedBy === user?.id;
  const assignedUser = users.find(u => u.id === device.assignedTo);
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const handleRequestDevice = () => {
    if (!user) return;
    
    try {
      dataStore.addRequest({
        deviceId: device.id,
        userId: user.id,
        status: 'pending',
        type: 'assign',
      });
      
      toast.success('Device requested successfully', {
        description: 'Your request has been submitted for approval'
      });
      if (onAction) onAction();
    } catch (error) {
      console.error('Error requesting device:', error);
      toast.error('Failed to request device');
    }
  };
  
  const handleReleaseDevice = () => {
    if (!user) return;
    
    try {
      dataStore.addRequest({
        deviceId: device.id,
        userId: user.id,
        status: 'pending',
        type: 'release',
      });
      
      toast.success('Device release requested', {
        description: 'Your request to release this device has been submitted'
      });
      if (onAction) onAction();
    } catch (error) {
      console.error('Error releasing device:', error);
      toast.error('Failed to release device');
    }
  };
  
  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available') => {
    if (!isManager) return;
    
    const confirmationMessage = `Are you sure you want to mark this device as ${newStatus}?`;
    
    if (window.confirm(confirmationMessage)) {
      try {
        dataStore.updateDevice(device.id, { status: newStatus });
        toast.success(`Device marked as ${newStatus}`, {
          description: `The status of ${device.name} has been updated`
        });
        if (onAction) onAction();
      } catch (error) {
        console.error('Error updating device status:', error);
        toast.error('Failed to update device status');
      }
    }
  };
  
  const handleDeleteDevice = () => {
    if (!isManager) return;
    
    const confirmationMessage = "Are you sure you want to permanently delete this device? This action cannot be undone.";
    
    if (window.confirm(confirmationMessage)) {
      try {
        const success = dataStore.deleteDevice(device.id);
        if (success) {
          toast.success('Device deleted', {
            description: `${device.name} has been permanently removed`
          });
          if (onAction) onAction();
        } else {
          toast.error('Failed to delete device');
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        toast.error('Failed to delete device');
      }
    }
  };
  
  return (
    <Card className={cn(
      "h-full overflow-hidden transition-all duration-300 hover:shadow-soft transform hover:-translate-y-1",
      {
        "border-red-300 bg-red-50/40": device.status === 'stolen',
        "border-amber-300 bg-amber-50/40": device.status === 'missing',
      },
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="flex items-center text-left w-full"
            >
              <CardTitle className="text-lg font-medium">{device.name}</CardTitle>
              {expanded ? 
                <ChevronDown className="h-4 w-4 ml-2" /> : 
                <ChevronRight className="h-4 w-4 ml-2" />
              }
            </button>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Smartphone className="h-3.5 w-3.5" />
              {device.type}
            </CardDescription>
          </div>
          <StatusBadge status={device.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 space-y-3">
        <div className="space-y-2 text-sm">
          {/* Always visible */}
          <div className="flex items-start">
            <Hash className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-muted-foreground">Serial Number</p>
              <p className="font-mono text-xs">{device.serialNumber}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Cpu className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-muted-foreground">IMEI</p>
              <p className="font-mono text-xs">{device.imei}</p>
            </div>
          </div>

          {/* Only visible when expanded */}
          {expanded && (
            <>
              {assignedUser && (
                <div className="flex items-start">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Assigned to</p>
                    <p className="text-sm">{assignedUser.name}</p>
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
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col space-y-2">
        {isManager ? (
          <div className="grid grid-cols-2 gap-2 w-full">
            {(device.status === 'available' || device.status === 'assigned') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange('missing')}
                className="text-xs"
              >
                Mark Missing
              </Button>
            )}
            
            {(device.status === 'available' || device.status === 'assigned') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange('stolen')}
                className="text-xs text-destructive"
              >
                Mark Stolen
              </Button>
            )}
            
            {(device.status === 'missing' || device.status === 'stolen') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange('available')}
                className="text-xs col-span-2"
              >
                Mark as Available
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteDevice}
              className="text-xs col-span-2 mt-2"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Device
            </Button>
          </div>
        ) : (
          <>
            {device.status === 'available' && !hasRequested && (
              <Button 
                className="w-full" 
                size="sm" 
                onClick={handleRequestDevice}
              >
                Request Device
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            
            {hasRequested && (
              <Button 
                variant="secondary" 
                className="w-full" 
                size="sm" 
                disabled
              >
                Request Pending
              </Button>
            )}
            
            {isDeviceOwner && (
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm" 
                onClick={handleReleaseDevice}
              >
                Release Device
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default DeviceCard;
