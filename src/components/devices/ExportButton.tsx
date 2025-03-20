
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Device, User } from '@/types';
import { exportDevicesToExcel } from '@/utils/exportUtils';
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
  exportFileName = 'Device_List',
  variant = 'outline',
  className,
}) => {
  const { isManager } = useAuth();

  const handleExport = () => {
    try {
      exportDevicesToExcel(devices, exportFileName);
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
