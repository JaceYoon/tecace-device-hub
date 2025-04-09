
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeviceRequest, Device, User } from '@/types';
import { Clock } from 'lucide-react';

interface PendingDeviceRequestsProps {
  pendingRequests: DeviceRequest[];
  devices: {[key: string]: Device};
  users: {[key: string]: User};
  handleProcessRequest: (requestId: string, approve: boolean) => Promise<void>;
  isAdmin: boolean;
}

const PendingDeviceRequests: React.FC<PendingDeviceRequestsProps> = ({
  pendingRequests,
  devices,
  users,
  handleProcessRequest,
  isAdmin
}) => {
  // Only show to admin users
  if (!isAdmin || pendingRequests.length === 0) {
    return null;
  }
  
  return (
    <div className="rounded-lg border p-4 animate-slide-up">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Pending Requests
        <Badge variant="outline" className="ml-2 bg-accent/20">
          {pendingRequests.length}
        </Badge>
      </h2>

      <div className="space-y-4">
        {pendingRequests.map(request => {
          const device = devices[request.deviceId];
          const requestUser = users[request.userId];
          
          const deviceName = device ? (device.project || device.projectGroup || 'Unknown Device') : 'Unknown Device';
          const userName = requestUser ? requestUser.name || 'Unknown User' : 'Unknown User';
          const serialNumber = device ? device.serialNumber : 'N/A';
          
          return (
            <div
              key={request.id}
              className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{deviceName}</p>
                <p className="text-sm text-muted-foreground">
                  {request.type === 'assign' ? 'Assignment' : 'Release'} request from {userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Serial: {serialNumber}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProcessRequest(request.id, false)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleProcessRequest(request.id, true)}
                >
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingDeviceRequests;
