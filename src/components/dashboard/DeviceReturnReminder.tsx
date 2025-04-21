
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, addYears, isAfter, parseISO } from 'date-fns';
import { Clock, CalendarClock, X } from 'lucide-react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DeviceReturnReminderProps {
  devices: Device[];
  userId: string;
}

const DeviceReturnReminder: React.FC<DeviceReturnReminderProps> = ({ devices, userId }) => {
  const navigate = useNavigate();
  const [overdueDevices, setOverdueDevices] = useState<Device[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedReturnReminders');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const now = new Date();
    
    // Filter devices:
    // 1. Assigned to current user
    // 2. Has a receivedDate
    // 3. receivedDate is over 1 year ago
    // 4. Not in dismissed list
    const overdue = devices.filter(device => {
      if (device.assignedToId !== userId || !device.receivedDate || dismissed.includes(device.id)) {
        return false;
      }
      
      const receivedDate = typeof device.receivedDate === 'string' 
        ? parseISO(device.receivedDate) 
        : device.receivedDate;
      
      const returnDueDate = addYears(receivedDate, 1);
      return isAfter(now, returnDueDate);
    });
    
    setOverdueDevices(overdue);
  }, [devices, userId, dismissed]);

  const handleDismiss = (deviceId: string) => {
    const newDismissed = [...dismissed, deviceId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedReturnReminders', JSON.stringify(newDismissed));
  };

  const handleViewDevices = () => {
    navigate('/my-devices');
  };

  if (overdueDevices.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950 dark:border-amber-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-medium text-amber-800 dark:text-amber-200">
          <CalendarClock className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
          Return Reminder
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          You have {overdueDevices.length} device(s) that have been assigned for over a year
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {overdueDevices.map(device => (
            <div key={device.id} className="flex justify-between items-center bg-white dark:bg-amber-900 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <div>
                <div className="font-medium text-amber-900 dark:text-amber-100">{device.project}</div>
                <div className="text-sm text-amber-600 dark:text-amber-300">
                  Assigned {device.receivedDate && formatDistanceToNow(
                    typeof device.receivedDate === 'string' ? parseISO(device.receivedDate) : device.receivedDate,
                    { addSuffix: true }
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-800"
                onClick={() => handleDismiss(device.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600"
          onClick={handleViewDevices}
        >
          <Clock className="mr-2 h-4 w-4" /> View My Devices
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceReturnReminder;
