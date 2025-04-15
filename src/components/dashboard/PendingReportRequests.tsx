import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeviceRequest, Device, User } from '@/types';
import { FlagTriangleRight } from 'lucide-react';

interface PendingReportRequestsProps {
  reportRequests: DeviceRequest[];
  devices: {[key: string]: Device};
  users: {[key: string]: User};
  handleProcessRequest: (requestId: string, approve: boolean) => Promise<void>;
  isAdmin: boolean;
}

const PendingReportRequests: React.FC<PendingReportRequestsProps> = ({
  reportRequests,
  devices,
  users,
  handleProcessRequest,
  isAdmin
}) => {
  if (!isAdmin || reportRequests.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-300 p-4 animate-slide-up bg-red-300 dark:bg-red-400">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-700">
        <FlagTriangleRight className="h-5 w-5 text-red-600" />
        Report device requests
        <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-300">
          {reportRequests.length}
        </Badge>
      </h2>

      <div className="space-y-4">
        {reportRequests.map(request => {
          const device = devices[request.deviceId];
          const requestUser = users[request.userId];
          
          const deviceName = device ? (device.project || device.projectGroup || 'Unknown Device') : 'Unknown Device';
          const userName = requestUser ? requestUser.name || 'Unknown User' : 'Unknown User';
          const serialNumber = device ? device.serialNumber : 'N/A';
          const imei = device ? device.imei : 'N/A';
          const reportType = request.reportType || 'N/A';
          const reason = request.reason || 'No description provided';
          
          return (
            <div
              key={request.id}
              className="flex items-center justify-between border-b border-red-200 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="w-3/4">
                <p className="font-medium text-red-800">{deviceName}</p>
                <div className="mt-1 text-sm space-y-1">
                  <p className="text-red-700">
                    <span className="font-semibold">Report type:</span> {reportType}
                  </p>
                  <p className="text-red-700">
                    <span className="font-semibold">From:</span> {userName}
                  </p>
                  <p className="text-red-700">
                    <span className="font-semibold">Serial Number:</span> {serialNumber}
                  </p>
                  <p className="text-red-700">
                    <span className="font-semibold">Description:</span> {reason}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProcessRequest(request.id, false)}
                  className="bg-black hover:bg-white/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleProcessRequest(request.id, true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
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

export default PendingReportRequests;
