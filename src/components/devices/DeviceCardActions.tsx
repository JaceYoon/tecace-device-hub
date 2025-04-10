
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Device } from '@/types';
import DeviceEditDialog from './DeviceEditDialog';
import { useDeviceManagement } from './hooks/useDeviceManagement';

interface DeviceCardActionsProps {
  device: Device;
  isAdmin: boolean;
  isDeviceOwner: boolean;
  hasRequested: boolean;
  isRequested: boolean;
  isRequestedByOthers: boolean;
  isProcessing: boolean;
  showReturnControls?: boolean;
  userId?: string;
  onRequestDevice: () => void;
  onReleaseDevice: () => void;
  onStatusChange: (status: 'available' | 'missing' | 'stolen' | 'dead') => void;
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
  showReturnControls = false,
  userId,
  onRequestDevice,
  onReleaseDevice,
  onStatusChange,
  onAction
}) => {
  // Only show buttons if operations are valid
  const isAvailable = device.status === 'available';
  const isAssigned = device.status === 'assigned';
  const isStolen = device.status === 'stolen';
  const isMissing = device.status === 'missing';
  
  const showRequestButton = isAvailable && !hasRequested && !isRequested;
  const showReturnButton = isAssigned && isDeviceOwner && !hasRequested;
  const showCancelButton = hasRequested && userId;
  
  return (
    <div className="flex flex-wrap gap-2 w-full">
      {isProcessing && (
        <Button disabled className="w-full">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </Button>
      )}
      
      {!isProcessing && (
        <>
          {showRequestButton && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={onRequestDevice}
              disabled={isProcessing}
            >
              Request
            </Button>
          )}
          
          {showReturnButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onReleaseDevice}
              disabled={isProcessing}
            >
              Return
            </Button>
          )}
          
          {(isDeviceOwner || isAdmin) && (
            <DeviceEditDialog 
              device={device} 
              onDeviceUpdated={onAction}
              triggerElement={
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              }
            />
          )}
          
          {/* Only show "Mark as Available" for admin users and for devices
              that are not currently missing or stolen */}
          {isAdmin && !isMissing && !isStolen && !isAvailable && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onStatusChange('available')}
              disabled={isProcessing}
            >
              Mark Available
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default DeviceCardActions;
