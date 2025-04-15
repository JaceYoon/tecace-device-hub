
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield, PackageCheck, AlertCircle, ShieldAlert, Zap, Clock } from 'lucide-react';
import StatusCard from './StatusCard';
import { useStatusSummary } from './hooks/useStatusSummary';

interface StatusSummaryProps {
  onRefresh?: () => void;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ onRefresh }) => {
  const { 
    loading, 
    error, 
    deviceCounts, 
    isAuthenticated, 
    isAdmin,
    handleRefresh 
  } = useStatusSummary(onRefresh);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Device Status Summary</h2>
        <Button 
          onClick={handleRefresh}
          className="flex items-center bg-slate-600 text-white border border-black hover:bg-slate-700"
          size="sm"
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
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatusCard 
          icon={Shield} 
          count={deviceCounts.availableCount} 
          label="Available" 
          color="bg-green-500" 
        />
        <StatusCard 
          icon={PackageCheck} 
          count={deviceCounts.assignedCount} 
          label="Assigned" 
          color="bg-blue-500" 
        />
        <StatusCard 
          icon={AlertCircle} 
          count={deviceCounts.pendingCount} 
          label="Pending Requests" 
          color="bg-amber-500" 
        />
        <StatusCard 
          icon={Zap} 
          count={deviceCounts.deadCount} 
          label="Dead" 
          color="bg-gray-500" 
        />
        {isAdmin && (
          <>
            <StatusCard 
              icon={AlertCircle} 
              count={deviceCounts.missingCount} 
              label="Missing" 
              color="bg-orange-500" 
            />
            <StatusCard 
              icon={ShieldAlert} 
              count={deviceCounts.stolenCount} 
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
