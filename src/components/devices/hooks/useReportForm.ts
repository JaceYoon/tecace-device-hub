
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';

// Form schema definition
export const reportFormSchema = z.object({
  reportType: z.enum(['missing', 'stolen', 'dead'], {
    required_error: "Please select a report type",
  }),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters",
  }).max(500, {
    message: "Reason must not exceed 500 characters",
  }),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const useReportForm = (
  device: Device, 
  userId: string,
  onReportSubmitted?: () => void
) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: undefined,
      reason: "",
    },
  });

  // Check if the device has any pending requests
  const deviceHasPendingRequest = device.requestedBy && device.requestedBy !== "";
  const deviceIsPending = device.status === 'pending';
  const hasPendingRequest = deviceIsPending || deviceHasPendingRequest;

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (values: ReportFormValues) => {
    if (hasPendingRequest) {
      toast.error('There is already a pending request for this device');
      setOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('Submitting report with values:', values);
      
      await dataService.addRequest({
        deviceId: device.id,
        userId: userId,
        status: 'pending',
        type: 'report',
        reportType: values.reportType,
        reason: values.reason,
      });
      
      toast.success('Report submitted successfully', {
        description: 'An administrator will review your report'
      });
      
      setOpen(false);
      form.reset();
      
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error instanceof Error && error.message.includes('already a pending request')) {
        toast.error('This device already has a pending request', {
          description: 'Please wait for the current request to be processed'
        });
      } else {
        toast.error('Failed to submit report', {
          description: 'Please try again later'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    open,
    setOpen,
    handleOpenChange,
    isSubmitting,
    hasPendingRequest,
    onSubmit,
  };
};
