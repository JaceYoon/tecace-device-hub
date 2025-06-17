
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Device, User } from '@/types';
import { exportDevicesToExcel } from '@/utils/exports'; // Updated import path
import { useAuth } from '@/components/auth/AuthProvider';

interface ExportButtonProps {
  devices: Device[];
  users: User[];
  exportFileName?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  devices,
  users,
  exportFileName,
  variant = 'outline',
  className,
}) => {
  const { isManager } = useAuth();

  const handleExport = () => {
    try {
      if (devices.length === 0) {
        toast.warning('No devices to export');
        return;
      }
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = exportFileName || `TecAce_SEA_DeviceList_${currentDate}.xlsx`;
      
      exportDevicesToExcel(devices, filename);
      toast.success('Device list exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export device list');
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleExport}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Export to Excel
    </Button>
  );
};

export default ExportButton;
