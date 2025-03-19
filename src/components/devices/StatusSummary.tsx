
import React, { useState, useEffect } from 'react';
import { dataService } from '@/services/data.service';
import { Device } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, PackageCheck, AlertCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';

interface StatusSummaryProps {
  onRefresh?: () => void;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ onRefresh }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const allDevices = await dataService.getDevices();
      setDevices(allDevices);
    } catch (error) {
      console.error('Error fetching devices for status summary:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDevices();
  }, []);
  
  const handleRefresh = () => {
    fetchDevices();
    if (onRefresh) onRefresh();
  };
  
  const availableCount = devices.filter(d => d.status === 'available').length;
  const assignedCount = devices.filter(d => d.status === 'assigned').length;
  const missingCount = devices.filter(d => d.status === 'missing').length;
  const stolenCount = devices.filter(d => d.status === 'stolen').length;
  const pendingCount = devices.filter(d => d.requestedBy).length;
  
  const StatusCard = ({ 
    icon: Icon, 
    count, 
    label, 
    color 
  }: { 
    icon: React.ElementType, 
    count: number, 
    label: string,
    color: string
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Device Status Summary</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatusCard 
          icon={Shield} 
          count={availableCount} 
          label="Available" 
          color="bg-green-500" 
        />
        <StatusCard 
          icon={PackageCheck} 
          count={assignedCount} 
          label="Assigned" 
          color="bg-blue-500" 
        />
        <StatusCard 
          icon={AlertCircle} 
          count={pendingCount} 
          label="Pending Requests" 
          color="bg-amber-500" 
        />
        {isAdmin && (
          <>
            <StatusCard 
              icon={AlertCircle} 
              count={missingCount} 
              label="Missing" 
              color="bg-orange-500" 
            />
            <StatusCard 
              icon={ShieldAlert} 
              count={stolenCount} 
              label="Stolen" 
              color="bg-red-500" 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StatusSummary;
