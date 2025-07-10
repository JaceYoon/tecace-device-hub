import React from 'react';
import { Device } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Loader2 } from 'lucide-react';

interface ShippableDevicesListProps {
  devices: Device[];
  isLoading: boolean;
  selectedDevices: string[];
  onDeviceSelect: (deviceId: string) => void;
  onCreateShippingRequests: () => void;
}

const ShippableDevicesList: React.FC<ShippableDevicesListProps> = ({
  devices,
  isLoading,
  selectedDevices,
  onDeviceSelect,
  onCreateShippingRequests
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading devices...</p>
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No devices found</h3>
          <p className="text-muted-foreground">
            No devices match your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Found {devices.length} device(s)
        </h3>
        {selectedDevices.length > 0 && (
          <Button onClick={onCreateShippingRequests}>
            Create Shipping Requests ({selectedDevices.length})
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {devices.map((device) => (
          <Card key={device.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedDevices.includes(device.id)}
                    onCheckedChange={() => onDeviceSelect(device.id)}
                  />
                  <div>
                    <h4 className="font-semibold">{device.project}</h4>
                    <p className="text-sm text-muted-foreground">
                      {device.modelNumber} • {device.serialNumber}
                    </p>
                    {device.project && (
                      <p className="text-sm text-muted-foreground">
                        Project: {device.project}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{device.status}</Badge>
                  {device.assignedTo && (
                    <Badge variant="secondary">
                      Assigned to: {device.assignedTo}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShippableDevicesList;