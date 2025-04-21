
import React, { useEffect, useState } from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { RefreshCw, Search } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(returnedDevices);

  // Effect to log devices count when it changes
  useEffect(() => {
    console.log(`ReturnedDevicesList rendering with ${returnedDevices.length} devices`);
  }, [returnedDevices.length]);

  // Update filtered devices when search query or device list changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDevices(returnedDevices);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = returnedDevices.filter(device => {
      return (
        // Search by project name
        (device.project && device.project.toLowerCase().includes(query)) ||
        // Search by project group
        (device.projectGroup && device.projectGroup.toLowerCase().includes(query)) ||
        // Search by serial number
        (device.serialNumber && device.serialNumber.toLowerCase().includes(query)) ||
        // Search by IMEI
        (device.imei && device.imei.toLowerCase().includes(query)) ||
        // Search by return date
        (device.returnDate && format(new Date(device.returnDate), 'yyyy-MM-dd').includes(query))
      );
    });

    setFilteredDevices(filtered);
  }, [searchQuery, returnedDevices]);

  const handleRefresh = () => {
    console.log('Manual refresh requested');
    onRefresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Returned Devices</h2>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project, serial number, IMEI, or return date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {isLoading ? (
        <p>Loading returned devices...</p>
      ) : filteredDevices.length === 0 ? (
        searchQuery ? 
          <p>No devices match your search criteria</p> : 
          <p>No returned devices found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => (
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
                  {device.projectGroup && (
                    <div>
                      <span className="text-muted-foreground">Project Group:</span> 
                      <span>{device.projectGroup}</span>
                    </div>
                  )}
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
