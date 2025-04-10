import React from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MoreHorizontal, RotateCcw, ShieldAlert, UserPlus, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DeviceCardActionsProps {
  device: Device;
  isAdmin: boolean;
  isDeviceOwner: boolean;
  hasRequested: boolean;
  isRequested: boolean;
  isRequestedByOthers: boolean;
  isProcessing: boolean;
  showReturnControls: boolean;
  userId: string | undefined;
  onRequestDevice: () => void;
  onReleaseDevice: () => void;
  onStatusChange?: (status: string) => void;
  onAction?: () => void;
}

const DeviceCardActions: React.FC<DeviceCardActionsProps> = ({
  device,
  isAdmin,
  isDeviceOwner,
  hasRequested,
  isRequested,
  isRequestedByOthers,
  isProcessing,
  showReturnControls,
  userId,
  onRequestDevice,
  onReleaseDevice,
  onStatusChange,
  onAction
}) => {
  const handleReturnDevice = async () => {
    if (device.id && userId) {
      try {
        await onRequestDevice();
        toast.success('Device return requested');
      } catch (error) {
        console.error('Error requesting device:', error);
        toast.error('Failed to request device return');
      }
    } else {
      toast.error('Device or user ID is missing');
    }
  };

  const handleRequestDevice = async () => {
    if (device.id && userId) {
      try {
        await onRequestDevice();
        toast.success('Device request submitted');
      } catch (error) {
        console.error('Error requesting device:', error);
        toast.error('Failed to request device');
      }
    } else {
      toast.error('Device or user ID is missing');
    }
  };

  const handleReleaseDevice = async () => {
    if (device.id && userId) {
      try {
        await onReleaseDevice();
        toast.success('Device release requested');
      } catch (error) {
        console.error('Error releasing device:', error);
        toast.error('Failed to release device');
      }
    } else {
      toast.error('Device or user ID is missing');
    }
  };

  const handleMarkAsAvailable = async () => {
    if (device.id && onStatusChange) {
      try {
        await onStatusChange('available');
        toast.success('Device marked as available');
        if (onAction) {
          onAction();
        }
      } catch (error) {
        console.error('Error marking device as available:', error);
        toast.error('Failed to mark device as available');
      }
    }
  };

  return (
    <>
      {showReturnControls && isDeviceOwner && device.status === 'assigned' && (
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleReturnDevice}
          disabled={isProcessing}
        >
          <RotateCcw className="h-4 w-4" />
          Return Device
        </Button>
      )}

      {isAdmin && device.status === 'pending' && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="w-1/2"
            onClick={() => onStatusChange && onStatusChange('available')}
            disabled={isProcessing}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            className="w-1/2"
            onClick={() => onStatusChange && onStatusChange('rejected')}
            disabled={isProcessing}
          >
            Reject
          </Button>
        </div>
      )}

      {device.status === 'available' && !isDeviceOwner && !hasRequested && !isRequested && (
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleRequestDevice}
          disabled={isProcessing}
        >
          <UserPlus className="h-4 w-4" />
          Request Device
        </Button>
      )}

      {device.status === 'assigned' && isDeviceOwner && (
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleReleaseDevice}
          disabled={isProcessing}
        >
          <UserX className="h-4 w-4" />
          Release Device
        </Button>
      )}

      {isAdmin && device.status === 'available' && (
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleMarkAsAvailable}
          disabled={isProcessing}
        >
          Mark as Available
        </Button>
      )}
    </>
  );
};

export default DeviceCardActions;
