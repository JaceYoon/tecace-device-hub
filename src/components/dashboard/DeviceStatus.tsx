
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dataService } from '@/services/data.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Device } from '@/types';

const DeviceStatus: React.FC = () => {
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        setLoading(true);
        const devices = await dataService.getDevices();
        
        // Count devices by status
        const statusCounts: Record<string, number> = {};
        devices.forEach((device: Device) => {
          const status = device.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Create chart data
        const chartData = [
          { name: 'Available', value: statusCounts['available'] || 0, color: '#10b981' },
          { name: 'Assigned', value: statusCounts['assigned'] || 0, color: '#8b5cf6' },
          { name: 'Missing', value: statusCounts['missing'] || 0, color: '#f59e0b' },
          { name: 'Stolen', value: statusCounts['stolen'] || 0, color: '#ef4444' },
          { name: 'Dead', value: statusCounts['dead'] || 0, color: '#6b7280' }
        ].filter(item => item.value > 0); // Remove zero values
        
        setData(chartData);
      } catch (error) {
        console.error('Error fetching status data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatusData();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Device Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[150px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Device Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[150px] text-muted-foreground">
            No device data available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Device Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} devices`, 'Count']}
                labelFormatter={(name) => `Status: ${name}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceStatus;
