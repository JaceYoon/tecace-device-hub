
import React from 'react';
import { Device } from '@/types';
import { Button } from "@/components/ui/button";
import { Check, Clock, ChevronRight } from 'lucide-react';
import ReportDeviceDialog from './ReportDeviceDialog';

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
  onStatusChange: (status: 'missing' | 'stolen' | 'available' | 'dead') => void;
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
  // Fixed conditional logic to properly detect pending status
  // Only consider a device pending if it's explicitly marked as pending OR has a non-empty requestedBy field
  const deviceHasPendingRequest = device.requestedBy !== undefined && device.requestedBy !== "";
  const deviceIsPending = device.status === 'pending';
  
  // True pending state is either the device is in pending status OR has an active request
  const isPending = deviceIsPending || deviceHasPendingRequest;

  return (
    <>
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-2 w-full">
          {(device.status === 'missing' || device.status === 'stolen') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange('available')}
              className="text-xs col-span-1"
            >
              Mark as Available
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Request Device button - show when available and no pending requests */}
          {device.status === 'available' && !isRequested && !isPending && (
            <Button
              className="w-full"
              size="sm"
              onClick={onRequestDevice}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Request Device
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}

          {/* Pending Request button */}
          {hasRequested && (
            <Button
              variant="secondary"
              className="w-full"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-1" />
              Request Pending
            </Button>
          )}

          {/* Already Requested button */}
          {isRequestedByOthers && (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-1" />
              Already Requested
            </Button>
          )}

          {/* Device Pending status button */}
          {deviceIsPending && !hasRequested && !isRequestedByOthers && (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-1" />
              Device Pending
            </Button>
          )}

          {/* Return Device button */}
          {(isDeviceOwner || showReturnControls) && device.status === 'assigned' && (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={onReleaseDevice}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Return Device</>
              )}
            </Button>
          )}
          
          {/* Report Issue button - only show for available devices without pending requests */}
          {userId && !isAdmin && device.status === 'available' && !isPending && (
            <ReportDeviceDialog 
              device={device} 
              userId={userId} 
              onReportSubmitted={onAction}
            />
          )}
          
          {/* Empty div to create space before the collapse button */}
          <div className="h-4"></div>
        </>
      )}
    </>
  );
};

export default DeviceCardActions;
