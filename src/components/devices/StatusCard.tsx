
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatusCardProps { 
  icon: React.ElementType, 
  count: number, 
  label: string,
  color: string
}

const StatusCard: React.FC<StatusCardProps> = ({ 
  icon: Icon, 
  count, 
  label, 
  color 
}) => (
  <Card className={`${color} hover:shadow-md transition-all`}>
    <CardContent className="p-4 flex items-center">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-white/20">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-white">
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-xs font-medium opacity-90">{label}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatusCard;
