
import React, { useState, useEffect } from 'react';
import { dataService } from '@/services/data.service';
import { Device, DeviceRequest } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, PackageCheck, AlertCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface StatusSummaryProps {
  onRefresh?: () => void;
  refreshTrigger?: number; // Add refreshTrigger as an optional prop
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ onRefresh, refreshTrigger }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Safely get auth context with fallback for when not initialized
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Auth context not ready:', error);
    // Provide default values that won't break the component
    authContext = {
      isAdmin: false,
      isManager: false, 
      isAuthenticated: false,
      user: null
    };
  }
  
  const { isAdmin, isManager, isAuthenticated, user } = authContext;
  
  const fetchData = async () => {
    // Exit immediately if not authenticated
    if (!isAuthenticated || !user) {
      setDevices([]);
      setRequests([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled([
        dataService.getDevices(),
        dataService.devices.getAllRequests()
      ]);
      
      // Handle devices result
      if (results[0].status === 'fulfilled') {
        console.log('StatusSummary - fetched devices:', results[0].value.length);
        setDevices(results[0].value);
      } else {
        console.error('Error fetching devices:', results[0].reason);
        setDevices([]);
      }
      
      // Handle requests result
      if (results[1].status === 'fulfilled') {
        console.log('StatusSummary - fetched requests:', results[1].value.length);
        setRequests(results[1].value);
      } else {
        console.error('Error fetching requests:', results[1].reason);
        setRequests([]);
        
        // Only show the toast for request errors if they're not network related
        const errorMessage = results[1].reason?.message || 'Unknown error';
        if (!errorMessage.includes('Failed to fetch') && 
            !errorMessage.includes('ECONNREFUSED')) {
          toast.error(`Error loading requests: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error fetching data for status summary:', error);
      // Clear data on error to prevent stale data display
      setDevices([]);
      setRequests([]);
      setError((error as Error).message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Only fetch if authenticated
    if (isAuthenticated) {
      fetchData();
    } else {
      // Reset data if not authenticated
      setDevices([]);
      setRequests([]);
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshTrigger]); // Add refreshTrigger to dependencies
  
  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };
  
  // If not authenticated, don't show anything
  if (!isAuthenticated) {
    return null;
  }
  
  const availableCount = devices.filter(d => d.status === 'available' && !d.requestedBy).length;
  const assignedCount = devices.filter(d => d.status === 'assigned').length;
  const missingCount = devices.filter(d => d.status === 'missing').length;
  const stolenCount = devices.filter(d => d.status === 'stolen').length;
  
  // Count pending requests directly from the requests data
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  
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
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded border border-red-200">
          Error loading data: {error}
        </div>
      )}
      
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
        {(isAdmin || isManager) && (
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
