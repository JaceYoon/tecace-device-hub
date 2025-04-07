
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
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
          icon: Check
        };
      case 'assigned':
        return {
          label: 'Assigned',
          variant: 'outline' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          icon: Check
        };
      case 'missing':
        return {
          label: 'Missing',
          variant: 'outline' as const,
          className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
          icon: HelpCircle
        };
      case 'stolen':
        return {
          label: 'Stolen',
          variant: 'outline' as const,
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          icon: ShieldAlert
        };
      case 'returned':
        return {
          label: 'Returned',
          variant: 'outline' as const,
          className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
          icon: ArrowLeft
        };
      case 'dead':
        return {
          label: 'Dead',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
          icon: Zap
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
          icon: Clock
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
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
