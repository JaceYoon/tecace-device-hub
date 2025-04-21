
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dataService } from '@/services/data.service';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { DeviceRequest, User } from '@/types';

const UserActivity: React.FC = () => {
  const [data, setData] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        const [requests, users] = await Promise.all([
          dataService.devices.getAllRequests(),
          dataService.getUsers()
        ]);
        
        // Create a map of user IDs to names
        const userMap = new Map<string, string>();
        users.forEach((user: User) => {
          userMap.set(String(user.id), user.name || `User ${user.id}`);
        });
        
        // Count requests by user
        const userCounts: Record<string, number> = {};
        requests.forEach((request: DeviceRequest) => {
          if (!request.userId) return;
          
          const userId = String(request.userId);
          userCounts[userId] = (userCounts[userId] || 0) + 1;
        });
        
        // Create chart data - top 5 most active users
        const chartData = Object.entries(userCounts)
          .map(([userId, count]) => ({
            name: userMap.get(userId) || `User ${userId}`,
            userId,
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setData(chartData);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityData();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">User Activity</CardTitle>
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
          <CardTitle className="text-lg font-medium">User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[150px] text-muted-foreground">
            No user activity data available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 25,
              }}
            >
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} requests`, 'Count']}
                labelFormatter={(name) => `User: ${name}`}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActivity;
