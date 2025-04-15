
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeviceStatus } from '@/types';
import { AlertCircle, Check, HelpCircle, ShieldAlert, ArrowLeft, Zap, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: DeviceStatus;
  className?: string;
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true
}) => {
  const getStatusConfig = (status: DeviceStatus) => {
    switch(status) {
      case 'available':
        return {
          label: 'Available',
          variant: 'outline' as const,
          className: 'bg-green-500 dark:bg-green-600 text-white border-green-400',
          icon: Check
        };
      case 'assigned':
        return {
          label: 'Assigned',
          variant: 'outline' as const,
          className: 'bg-blue-500 dark:bg-blue-600 text-white border-blue-400',
          icon: Check
        };
      case 'missing':
        return {
          label: 'Missing',
          variant: 'outline' as const,
          className: 'bg-amber-500 dark:bg-amber-600 text-white border-amber-400',
          icon: HelpCircle
        };
      case 'stolen':
        return {
          label: 'Stolen',
          variant: 'outline' as const,
          className: 'bg-red-500 dark:bg-red-600 text-white border-red-400',
          icon: ShieldAlert
        };
      case 'returned':
        return {
          label: 'Returned',
          variant: 'outline' as const,
          className: 'bg-purple-500 dark:bg-purple-600 text-white border-purple-400',
          icon: ArrowLeft
        };
      case 'dead':
        return {
          label: 'Dead',
          variant: 'outline' as const,
          className: 'bg-gray-500 dark:bg-gray-600 text-white border-gray-400',
          icon: Zap
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-400',
          icon: Clock
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-500 dark:bg-gray-600 text-white border-gray-400',
          icon: AlertCircle
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

export default StatusBadge;
