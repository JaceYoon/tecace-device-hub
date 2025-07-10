import React from 'react';
import { Device } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ShippedDevicesListProps {
  shippedDevices: Device[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ShippedDevicesList: React.FC<ShippedDevicesListProps> = ({
  shippedDevices,
  isLoading,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading shipped devices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {shippedDevices.length} shipped device(s)
        </h3>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {shippedDevices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No shipped devices</h3>
            <p className="text-muted-foreground">
              No devices have been shipped yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shippedDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
                    {device.returnDate && (
                      <p className="text-sm text-muted-foreground">
                        Shipped: {format(new Date(device.returnDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Shipped</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippedDevicesList;