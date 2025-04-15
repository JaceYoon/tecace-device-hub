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
  const deviceHasPendingRequest = device.requestedBy && device.requestedBy !== "";
  const deviceIsPending = device.status === 'pending';
  const isPending = deviceIsPending || deviceHasPendingRequest;

  return (
    <div className="w-full flex flex-col gap-3 px-1 py-2">
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-3 w-full">
          {/* Admin controls were removed as per the original */}
        </div>
      ) : (
        <>
          {/* Request Device button - only show for available devices without pending requests */}
          {device.status === 'available' && !hasRequested && !isPending && (
            <Button
              className="w-full h-10 font-medium"
              size="sm"
              onClick={onRequestDevice}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
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
              className="w-full h-10 font-medium"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-2" />
              Request Pending
            </Button>
          )}

          {/* Already Requested button */}
          {isRequestedByOthers && (
            <Button
              variant="outline"
              className="w-full h-10 font-medium"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-2" />
              Already Requested
            </Button>
          )}

          {/* Device Pending status button */}
          {deviceIsPending && !hasRequested && !isRequestedByOthers && (
            <Button
              variant="outline"
              className="w-full h-10 font-medium"
              size="sm"
              disabled
            >
              <Clock className="h-4 w-4 mr-2" />
              Device Pending
            </Button>
          )}

          {/* Return Device button */}
          {(isDeviceOwner || showReturnControls) && device.status === 'assigned' && (
            <Button
              variant="outline"
              className="w-full h-10 font-medium"
              size="sm"
              onClick={onReleaseDevice}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Return Device</>
              )}
            </Button>
          )}
          
          {/* Report Issue button - show for available devices without pending requests */}
          {userId && !isAdmin && device.status === 'available' && !isPending && (
            <div className="w-full">
              <ReportDeviceDialog 
                device={device} 
                userId={userId} 
                onReportSubmitted={onAction}
              />
            </div>
          )}
          
          {/* Add empty div for spacing */}
          <div className="h-0"></div>
        </>
      )}
    </div>
  );
};

export default DeviceCardActions;
