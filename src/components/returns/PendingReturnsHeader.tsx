
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface PendingReturnsHeaderProps {
  selectedCount: number;
  onConfirmReturns: () => void;
}

const PendingReturnsHeader: React.FC<PendingReturnsHeaderProps> = ({
  selectedCount,
  onConfirmReturns
}) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Pending Return Requests</h2>
      <Button 
        onClick={onConfirmReturns}
        disabled={selectedCount === 0}
        variant="outline"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Confirm Returns
      </Button>
    </div>
  );
};

export default PendingReturnsHeader;
