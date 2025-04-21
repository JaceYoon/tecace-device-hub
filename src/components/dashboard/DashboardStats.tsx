
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dataService } from '@/services/data.service';
import { Smartphone, Upload, UserCheck, CircleAlert, Loader2 } from 'lucide-react';
import { Device } from '@/types';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalDevices: 0,
    availableDevices: 0,
    assignedDevices: 0,
    reportedDevices: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const calculateStats = async () => {
      try {
        setLoading(true);
        const devices = await dataService.getDevices();
        
        // Calculate stats from devices
        const total = devices.length;
        const available = devices.filter(d => d.status === 'available').length;
        const assigned = devices.filter(d => d.status === 'assigned').length;
        const reported = devices.filter(d => ['missing', 'stolen', 'dead'].includes(d.status)).length;
        
        setStats({
          totalDevices: total,
          availableDevices: available,
          assignedDevices: assigned,
          reportedDevices: reported
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateStats();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalDevices}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <Upload className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <span className="text-2xl font-bold">{stats.availableDevices}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-purple-500" />
              <span className="text-sm text-muted-foreground">Assigned</span>
            </div>
            <span className="text-2xl font-bold">{stats.assignedDevices}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <CircleAlert className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-sm text-muted-foreground">Reported</span>
            </div>
            <span className="text-2xl font-bold">{stats.reportedDevices}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStats;
