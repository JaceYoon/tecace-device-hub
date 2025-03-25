
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Device, User } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import DeviceCardImage from './DeviceCardImage';

interface DeviceCardProps {
  device: Device;
  users?: User[];
  onEdit?: (device: Device) => void;
  onEditHistory?: (device: Device) => void;
  showControls?: boolean;
  refreshTrigger?: number;
  showCardFooter?: boolean;
  className?: string;
  showReturnControls?: boolean;
  onAction?: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  users = [],
  onEdit,
  onEditHistory,
  showControls = true,
  refreshTrigger,
  showCardFooter = true,
  className,
  showReturnControls = false,
  onAction
}) => {
  const [expanded, setExpanded] = useState(false);
  const { isAdmin, isManager } = useAuth();

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(device);
    }
  };

  const handleHistoryClick = () => {
    if (onEditHistory) {
      onEditHistory(device);
    }
  };

  return (
    <Card className={`w-full transition-all duration-300 hover:shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">
            {device.project}
          </CardTitle>
          <StatusBadge status={device.status} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {device.projectGroup}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-0 h-6 w-6"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Display image if collapsed and available */}
      <DeviceCardImage 
        image={device.devicePicture} 
        deviceName={device.project}
        isCollapsed={!expanded} 
      />
      
      {expanded && (
        <CardContent className="pt-2 pb-2">
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-muted-foreground">Type:</div>
              <div>{device.type}</div>

              <div className="text-muted-foreground">Form Factor:</div>
              <div>{device.deviceType || 'N/A'}</div>

              <div className="text-muted-foreground">Serial:</div>
              <div className="truncate">{device.serialNumber || 'N/A'}</div>

              <div className="text-muted-foreground">IMEI:</div>
              <div className="truncate">{device.imei || 'N/A'}</div>

              <div className="text-muted-foreground">Status:</div>
              <div>{device.deviceStatus || 'N/A'}</div>

              <div className="text-muted-foreground">Assigned to:</div>
              <div>{device.assignedToName || 'Not assigned'}</div>
            </div>

            {device.notes && (
              <div className="mt-2">
                <div className="text-muted-foreground mb-1">Notes:</div>
                <div className="text-xs bg-muted p-2 rounded">{device.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      {showCardFooter && (
        <CardFooter className="pt-2 pb-3 gap-2 flex justify-between">
          {isManager && showControls && (
            <div className="flex items-center space-x-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleEditClick}
                className="flex items-center text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleHistoryClick}
                className="flex items-center text-xs"
              >
                History
              </Button>
            </div>
          )}
          
          {showControls && (
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-auto"
              onClick={onAction}
            >
              {device.status === 'assigned' ? 'Return' : 'Assign'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default DeviceCard;
