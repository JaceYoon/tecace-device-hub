
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
  // Device has a pending status (for any reason including reports or returns)
  const deviceIsPending = device.status === 'pending';

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
          {device.status === 'available' && !isRequested && (
            <Button
              className="w-full"
              size="sm"
              onClick={onRequestDevice}
              disabled={isProcessing || deviceIsPending}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : deviceIsPending ? (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Device Pending
                </>
              ) : (
                <>
                  Request Device
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}

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
          
          {userId && !isAdmin && device.status !== 'pending' && (
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
