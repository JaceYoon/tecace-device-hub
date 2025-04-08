
import React from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface ReturnedDevicesListProps {
  returnedDevices: Device[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ReturnedDevicesList: React.FC<ReturnedDevicesListProps> = ({
  returnedDevices,
  isLoading,
  onRefresh
}) => {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Returned Devices</h2>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <p>Loading returned devices...</p>
      ) : returnedDevices.length === 0 ? (
        <p>No returned devices found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {returnedDevices.map(device => (
            <Card key={device.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{device.project}</CardTitle>
                    <CardDescription>{device.type}</CardDescription>
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
                  <div>
                    <span className="text-muted-foreground">Return Date:</span> 
                    <span>{device.returnDate ? format(new Date(device.returnDate), 'PP') : 'N/A'}</span>
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

export default ReturnedDevicesList;
