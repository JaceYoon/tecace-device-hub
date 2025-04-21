
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Device } from '@/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { dataService } from '@/services/data.service';
import { Badge } from '@/components/ui/badge';

const RecentDevices: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const allDevices = await dataService.getDevices();
        
        // If admin, show last modified devices
        // If user, show devices assigned to them
        let filteredDevices;
        if (isAdmin) {
          // Sort by lastModified date (newest first) and take the first 5
          filteredDevices = allDevices
            .sort((a, b) => {
              const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
              const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);
        } else if (user) {
          // Get devices assigned to the current user, sort by received date
          filteredDevices = allDevices
            .filter(device => device.assignedToId === user.id)
            .sort((a, b) => {
              const dateA = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
              const dateB = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);
        } else {
          filteredDevices = [];
        }
        
        setDevices(filteredDevices);
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
  }, [isAdmin, user]);
  
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const handleViewAll = () => {
    navigate('/device-management');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Smartphone className="h-5 w-5 mr-2 text-blue-500" />
          {isAdmin ? 'Recent Devices' : 'My Devices'}
        </CardTitle>
        <CardDescription>
          {isAdmin ? 'Recently updated devices' : 'Devices assigned to you'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>{isAdmin ? 'No recent devices' : 'No devices assigned'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{isAdmin ? 'Updated' : 'Received'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/device-management?id=${device.id}`)}>
                    <TableCell className="font-medium">{device.project}</TableCell>
                    <TableCell>{device.serialNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={device.status === 'available' ? 'outline' : 
                                device.status === 'assigned' ? 'default' : 
                                device.status === 'missing' ? 'secondary' :
                                device.status === 'stolen' ? 'destructive' : 'outline'}
                      >
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isAdmin 
                        ? formatDate(device.lastModified)
                        : formatDate(device.receivedDate)
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleViewAll}
        >
          View all devices <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecentDevices;
