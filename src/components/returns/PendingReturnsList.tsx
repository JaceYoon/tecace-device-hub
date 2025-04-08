
import React from 'react';
import { DeviceRequest, Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface PendingReturnsListProps {
  pendingReturnRequests: DeviceRequest[];
  selectedPendingReturns: string[];
  isLoading: boolean;
  isProcessing: boolean;
  getDeviceData: (deviceId: string) => Device | null;
  onPendingReturnSelect: (requestId: string) => void;
  onCancelReturnRequest: (requestId: string) => void;
  onConfirmReturns: () => void;
}

const PendingReturnsList: React.FC<PendingReturnsListProps> = ({
  pendingReturnRequests,
  selectedPendingReturns,
  isLoading,
  isProcessing,
  getDeviceData,
  onPendingReturnSelect,
  onCancelReturnRequest,
  onConfirmReturns
}) => {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pending Return Requests</h2>
        <Button 
          onClick={onConfirmReturns}
          disabled={selectedPendingReturns.length === 0}
          variant="outline"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Confirm Returns
        </Button>
      </div>
      
      {isLoading ? (
        <p>Loading pending returns...</p>
      ) : pendingReturnRequests.length === 0 ? (
        <p>No pending return requests</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingReturnRequests.map(request => {
            const device = getDeviceData(request.deviceId);
            return (
              <Card key={request.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedPendingReturns.includes(request.id)}
                        onCheckedChange={() => onPendingReturnSelect(request.id)}
                        id={`request-${request.id}`}
                      />
                      <div>
                        <CardTitle className="text-lg">{device?.project || 'Unknown Device'}</CardTitle>
                        <CardDescription>{device?.type || 'Unknown Type'}</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => onCancelReturnRequest(request.id)}
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
                      <span className="font-mono">{device?.serialNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IMEI:</span>
                      <span className="font-mono">{device?.imei || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested On:</span> 
                      <span>{request.requestedAt ? format(new Date(request.requestedAt), 'PPP') : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default PendingReturnsList;
