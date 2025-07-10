import React from 'react';
import { DeviceRequest, Device } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Loader2, Clock, X } from 'lucide-react';
import { format } from 'date-fns';

interface PendingShippingListProps {
  pendingShippingRequests: DeviceRequest[];
  selectedPendingShipping: string[];
  isLoading: boolean;
  isProcessing: boolean;
  getDeviceData: (deviceId: string) => Device | undefined;
  onPendingShippingSelect: (requestId: string) => void;
  onCancelShippingRequest: (requestId: string) => void;
  onConfirmShipping: () => void;
}

const PendingShippingList: React.FC<PendingShippingListProps> = ({
  pendingShippingRequests,
  selectedPendingShipping,
  isLoading,
  isProcessing,
  getDeviceData,
  onPendingShippingSelect,
  onCancelShippingRequest,
  onConfirmShipping
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading pending shipping requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingShippingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No pending shipping requests</h3>
          <p className="text-muted-foreground">
            All shipping requests have been processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {pendingShippingRequests.length} pending shipping request(s)
        </h3>
        {selectedPendingShipping.length > 0 && (
          <Button onClick={onConfirmShipping} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Confirm Shipping (${selectedPendingShipping.length})`
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {pendingShippingRequests.map((request) => {
          const device = getDeviceData(request.deviceId);
          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedPendingShipping.includes(request.id)}
                      onCheckedChange={() => onPendingShippingSelect(request.id)}
                    />
                    <div>
                      <h4 className="font-semibold">
                        {device?.project || 'Unknown Device'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {device?.modelNumber} • {device?.serialNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Pending</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelShippingRequest(request.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PendingShippingList;