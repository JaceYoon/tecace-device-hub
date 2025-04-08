
import React from 'react';
import { Flag } from 'lucide-react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReportForm } from './hooks/useReportForm';
import ReportDeviceForm from './ReportDeviceForm';

interface ReportDeviceDialogProps {
  device: Device;
  userId: string;
  onReportSubmitted?: () => void;
}

const ReportDeviceDialog: React.FC<ReportDeviceDialogProps> = ({ 
  device, 
  userId,
  onReportSubmitted 
}) => {
  const {
    form,
    open,
    handleOpenChange,
    isSubmitting,
    hasPendingRequest,
    onSubmit
  } = useReportForm(device, userId, onReportSubmitted);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
          disabled={hasPendingRequest}
        >
          <Flag className="mr-2 h-4 w-4" />
          {hasPendingRequest ? 'Request Pending' : 'Report Issue'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Device Issue</DialogTitle>
          <DialogDescription>
            Report a problem with the device "{device.project}"
          </DialogDescription>
        </DialogHeader>
        
        <ReportDeviceForm
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReportDeviceDialog;
