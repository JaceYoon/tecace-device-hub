import React from 'react';
import { Device } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Calendar, User2 } from 'lucide-react';
import { format } from 'date-fns';

interface DeviceCardDetailsProps {
  device: Device;
  isExpanded: boolean;
}

const DeviceCardDetails: React.FC<DeviceCardDetailsProps> = ({ device, isExpanded }) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className={`space-y-4 ${isExpanded ? 'mt-4' : ''}`}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Serial Number:</p>
          <p className="font-medium">{device.serialNumber || 'Not available'}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">IMEI:</p>
          <p className="font-medium">{device.imei || 'Not available'}</p>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Received Date
              </p>
              <p className="font-medium">{formatDate(device.receivedDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <User2 className="h-3.5 w-3.5" />
                Added By
              </p>
              <p className="font-medium">{device.addedByName || 'Unknown'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5" />
                Device Type
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">{device.type}</Badge>
                <Badge variant="outline">{device.deviceType}</Badge>
              </div>
            </div>
          </div>

          {device.notes && (
            <div>
              <p className="text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm">{device.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeviceCardDetails;
