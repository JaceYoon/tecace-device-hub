
import React from 'react';
import { DeviceRequest } from '@/types';
import PendingReturnsHeader from './PendingReturnsHeader';
import PendingReturnItem from './PendingReturnItem';

interface PendingReturnsListProps {
  pendingReturnRequests: DeviceRequest[];
  selectedPendingReturns: string[];
  isLoading: boolean;
  isProcessing: boolean;
  getDeviceData: (requestOrId: DeviceRequest | string) => any;
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
      <PendingReturnsHeader 
        selectedCount={selectedPendingReturns.length}
        onConfirmReturns={onConfirmReturns}
      />
      
      {isLoading ? (
        <p>Loading pending returns...</p>
      ) : pendingReturnRequests.length === 0 ? (
        <p>No pending return requests</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingReturnRequests.map(request => (
            <PendingReturnItem 
              key={request.id}
              request={request}
              selected={selectedPendingReturns.includes(request.id)}
              isProcessing={isProcessing}
              device={getDeviceData(request)}
              onSelect={onPendingReturnSelect}
              onCancel={onCancelReturnRequest}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PendingReturnsList;
