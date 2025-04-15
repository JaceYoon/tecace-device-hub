
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RequestStatus } from '@/types';
import { Check, Clock, X, BanIcon } from 'lucide-react';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
  showIcon?: boolean;
}

const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true
}) => {
  const getStatusConfig = (status: RequestStatus) => {
    switch(status) {
      case 'pending':
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-400',
          icon: Clock
        };
      case 'approved':
        return {
          label: 'Approved',
          variant: 'outline' as const,
          className: 'bg-green-500 dark:bg-green-600 text-white border-green-400',
          icon: Check
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'outline' as const,
          className: 'bg-red-500 dark:bg-red-600 text-white border-red-400',
          icon: X
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'outline' as const,
          className: 'bg-gray-500 dark:bg-gray-600 text-white border-gray-400',
          icon: BanIcon
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-500 dark:bg-gray-600 text-white border-gray-400',
          icon: Clock
        };
    }
  };
  
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        'font-medium transition-all-ease',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 mr-1" />}
      {config.label}
    </Badge>
  );
};

export default RequestStatusBadge;
