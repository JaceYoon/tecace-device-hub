
import React, { useEffect } from 'react';
import { Device, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

interface ReportDeviceDialogProps {
  device: Device;
  userId: string;
  onReportSubmitted?: () => void;
}

const formSchema = z.object({
  reportType: z.enum(['missing', 'stolen', 'dead'], {
    required_error: "Please select a report type",
  }),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters",
  }).max(500, {
    message: "Reason must not exceed 500 characters",
  }),
});

const ReportDeviceDialog: React.FC<ReportDeviceDialogProps> = ({ 
  device, 
  userId,
  onReportSubmitted 
}) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: undefined,
      reason: "",
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // Check if device already has a pending request
  const hasPendingRequest = device.status === 'pending' || device.requestedBy !== undefined;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check again if the device already has a pending request
    if (hasPendingRequest) {
      toast.error('There is already a pending request for this device');
      setOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('Submitting report with values:', values);
      
      // Create the report request - the API will update the device status to pending
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
      
      // Check if it's a duplicate request error
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

  // Disable the report button if the device already has a pending request
  const isReportButtonDisabled = hasPendingRequest;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
          disabled={isReportButtonDisabled}
        >
          <Flag className="mr-2 h-4 w-4" />
          {isReportButtonDisabled ? 'Request Pending' : 'Report Issue'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Device Issue</DialogTitle>
          <DialogDescription>
            Report a problem with the device "{device.project}"
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Issue Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="missing" id="missing" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="missing">
                          Missing (device cannot be found)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="stolen" id="stolen" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="stolen">
                          Stolen (device was taken)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dead" id="dead" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="dead">
                          Dead (device no longer works)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reason">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe the issue in detail..."
                      className="resize-none h-[120px]"
                      id="reason"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include relevant details about when and how the issue occurred.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDeviceDialog;
