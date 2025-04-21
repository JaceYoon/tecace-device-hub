
import React from 'react';
import { Device, User } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Download, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import { useAuth } from '@/components/auth/AuthProvider';
import DeviceConfirmDialog from './DeviceConfirmDialog';
import { useDeviceActions } from './hooks/useDeviceActions';
import StatusBadge from '@/components/ui/StatusBadge';
// Import the necessary components for the old device badge
import { Clock, AlertCircle } from 'lucide-react';
import { addYears, isAfter, parseISO } from 'date-fns';

interface DeviceCardProps {
  device: Device;
  users: User[];
  onAction?: () => void;
  className?: string;
  showReturnControls?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (deviceId: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  users,
  onAction,
  className,
  showReturnControls = false,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { user, isAdmin } = useAuth();
  const { 
    isDeleting, 
    isProcessing,
    confirmDialog,
    handleRequestDevice,
    handleReleaseDevice,
    handleStatusChange,
    handleDeleteDevice,
    handleDownloadImage,
    closeConfirmation,
    showConfirmation
  } = useDeviceActions(device, onAction);
  
  // Add a function to check if device is old (assigned for more than a year)
  const isOldDevice = () => {
    if (!device.receivedDate || !device.assignedToId) return false;
    
    const now = new Date();
    const receivedDate = typeof device.receivedDate === 'string' 
      ? parseISO(device.receivedDate) 
      : device.receivedDate;
    
    const oneYearAfterReceived = addYears(receivedDate, 1);
    return isAfter(now, oneYearAfterReceived);
  };
  
  const oldDeviceAssignment = isOldDevice();

  const assignedUser = users.find(user => user.id === device.assignedToId);
  const addedUser = users.find(user => user.id === device.addedById);

  const handleToggleStatus = (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => {
    showConfirmation(
      "Change Device Status",
      `Are you sure you want to mark this device as ${newStatus}?`,
      () => handleStatusChange(newStatus)
    );
  };

  const handleRequest = () => {
    handleRequestDevice();
  };

  const handleDelete = () => {
    showConfirmation(
      "Delete Device",
      `Are you sure you want to delete ${device.project}? This action cannot be undone.`,
      handleDeleteDevice
    );
  };

  return (
    <Card className={cn("overflow-hidden", className, {
      "border-red-200 bg-red-50": device.status === "missing" || device.status === "stolen",
      "border-gray-200 bg-gray-50": device.status === "dead",
      "border-amber-200 bg-amber-50": device.status === "pending",
    })}>
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">
              {device.project}
              {oldDeviceAssignment && user?.id === device.assignedToId && (
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                  Old Device
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {device.type} • {device.projectGroup}
            </CardDescription>
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => onToggleExpand?.(device.id)}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <StatusBadge status={device.status} />
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Serial Number:</span> {device.serialNumber || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">IMEI:</span> {device.imei || 'N/A'}
          </div>
          {device.assignedToId && assignedUser && (
            <div>
              <span className="text-muted-foreground">Assigned to:</span>
              <div className="flex items-center mt-1">
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage src={`https://avatar.vercel.sh/${assignedUser.email}`} alt={assignedUser.name} />
                  <AvatarFallback>{assignedUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {assignedUser.name}
              </div>
            </div>
          )}
          {device.addedById && addedUser && (
            <div>
              <span className="text-muted-foreground">Added by:</span>
              <div className="flex items-center mt-1">
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage src={`https://avatar.vercel.sh/${addedUser.email}`} alt={addedUser.name} />
                  <AvatarFallback>{addedUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {addedUser.name}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardContent className={cn("p-0", { "hidden": !isExpanded })}>
        <div className="p-4 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Device Status:</span> {device.deviceStatus || 'N/A'}
          </div>
          {device.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span> {device.notes}
            </div>
          )}
        </div>
        
        {oldDeviceAssignment && user?.id === device.assignedToId && (
          <div className="p-3 bg-amber-50 border-t border-amber-200 text-amber-800 text-sm flex items-center">
            <Clock className="h-4 w-4 mr-2 text-amber-500" />
            This device has been assigned to you for over a year
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        {device.status === 'available' && !showReturnControls && (
          <Button onClick={handleRequest} disabled={isProcessing}>
            {isProcessing ? 'Requesting...' : 'Request Device'}
          </Button>
        )}
        {device.status !== 'available' && !showReturnControls && (
          <Button variant="destructive" onClick={handleReleaseDevice} disabled={isProcessing}>
            {isProcessing ? 'Releasing...' : 'Release Device'}
          </Button>
        )}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-auto">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleToggleStatus('available')}>
                Mark as Available
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus('missing')}>
                Mark as Missing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus('stolen')}>
                Mark as Stolen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus('dead')}>
                Mark as Dead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadImage}>
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Device
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
      
      {/* Return confirmation dialog */}
      <DeviceConfirmDialog
        open={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        onCancel={closeConfirmation}
      />
    </Card>
  );
};

export default DeviceCard;
