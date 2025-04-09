
import React from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';

interface ReturnableDevicesListProps {
  devices: Device[];
  isLoading: boolean;
  selectedDevices: string[];
  onDeviceSelect: (deviceId: string) => void;
  onCreateReturnRequests: () => void;
}

const ReturnableDevicesList: React.FC<ReturnableDevicesListProps> = ({
  devices,
  isLoading,
  selectedDevices,
  onDeviceSelect,
  onCreateReturnRequests
}) => {
  // Log devices for debugging
  console.log("ReturnableDevicesList - Devices:", devices);
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available & Dead Devices</h2>
        <Button 
          onClick={onCreateReturnRequests}
          disabled={selectedDevices.length === 0}
        >
          Add Return Request
        </Button>
      </div>
      
      {isLoading ? (
        <p>Loading devices...</p>
      ) : devices.length === 0 ? (
        <p>No returnable devices found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <Card key={device.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => onDeviceSelect(device.id)}
                      id={`device-${device.id}`}
                    />
                    <div>
                      <CardTitle className="text-lg">{device.project}</CardTitle>
                      <CardDescription>{device.type || 'Unknown Type'}</CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={device.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Serial Number:</span> 
                    <span className="font-mono">{device.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono">{device.imei || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default ReturnableDevicesList;
