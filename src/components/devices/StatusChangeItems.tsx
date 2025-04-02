
import React from 'react';
import { AlertCircle, Check, Flag } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface StatusChangeItemsProps {
  onStatusChange: (status: 'missing' | 'stolen' | 'available' | 'dead') => void;
}

export const StatusChangeItems: React.FC<StatusChangeItemsProps> = ({ onStatusChange }) => {
  return (
    <>
      <DropdownMenuItem onClick={() => onStatusChange('missing')}>
        <Flag className="mr-2 h-4 w-4 text-amber-500" />
        Mark as Missing
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onStatusChange('stolen')}>
        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
        Mark as Stolen
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onStatusChange('dead')}>
        <AlertCircle className="mr-2 h-4 w-4 text-gray-500" />
        Mark as Dead
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onStatusChange('available')}>
        <Check className="mr-2 h-4 w-4 text-green-500" />
        Mark as Available
      </DropdownMenuItem>
    </>
  );
};

export default StatusChangeItems;
