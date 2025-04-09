
import React from 'react';
import { DeviceRequest, Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { X, AlertCircle } from 'lucide-react';

interface PendingReturnItemProps {
  request: DeviceRequest;
  selected: boolean;
  isProcessing: boolean;
  device: Device | null;
  onSelect: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

const PendingReturnItem: React.FC<PendingReturnItemProps> = ({
  request,
  selected,
  isProcessing,
  device,
  onSelect,
  onCancel
}) => {
  // Log device information for debugging
  console.log(`PendingReturnItem - Device info for request ${request.id}:`, device);
  
  const deviceName = device?.project || request.deviceName || 'Unknown Device';
  const deviceType = device?.type || 'Unknown Type';
  const serialNumber = device?.serialNumber || 'N/A';
  const imei = device?.imei || 'N/A';
  
  const missingInfo = !device || !device.serialNumber || !device.imei;
  
  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selected}
              onCheckedChange={() => onSelect(request.id)}
              id={`request-${request.id}`}
            />
            <div>
              <CardTitle className="text-lg">{deviceName}</CardTitle>
              <CardDescription>{deviceType}</CardDescription>
              {missingInfo && (
                <span className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> Missing device information
                </span>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive"
            onClick={() => onCancel(request.id)}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Serial Number:</span> 
            <span className="font-mono">{serialNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">IMEI:</span>
            <span className="font-mono">{imei}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Requested On:</span> 
            <span>{request.requestedAt ? format(new Date(request.requestedAt), 'PPP') : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingReturnItem;
