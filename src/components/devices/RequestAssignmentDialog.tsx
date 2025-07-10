import React, { useState } from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

const requestFormSchema = z.object({
  rentalPeriod: z.enum(['30', '60', '90', 'custom'], {
    required_error: "Please select a rental period",
  }),
  customDays: z.number().min(7, "Minimum rental period is 7 days").max(365, "Maximum rental period is 365 days").optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestAssignmentDialogProps {
  device: Device;
  userId: string | undefined;
  isProcessing: boolean;
  onRequestSubmitted: () => void;
  trigger: React.ReactNode;
}

const RequestAssignmentDialog: React.FC<RequestAssignmentDialogProps> = ({
  device,
  userId,
  isProcessing,
  onRequestSubmitted,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      rentalPeriod: '90',
      customDays: undefined,
    },
  });

  const watchedRentalPeriod = form.watch('rentalPeriod');

  const onSubmit = async (values: RequestFormValues) => {
    if (!userId) return;

    try {
      setIsSubmitting(true);
      
      // Calculate rental period in days
      let rentalPeriodDays: number;
      if (values.rentalPeriod === 'custom') {
        rentalPeriodDays = values.customDays || 90;
      } else {
        rentalPeriodDays = parseInt(values.rentalPeriod);
      }
      
      // Create request with rental period
      await dataService.devices.requestDevice(device.id, 'assign', {
        reason: `Device requested for ${rentalPeriodDays} days`,
        rentalPeriodDays
      });
      
      toast.success('Device requested successfully', {
        description: `Request submitted for ${rentalPeriodDays} days rental period`
      });
      
      setOpen(false);
      form.reset();
      onRequestSubmitted();
    } catch (error) {
      console.error('Error requesting device:', error);
      toast.error('Failed to request device. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Device Assignment</DialogTitle>
          <DialogDescription>
            Request {device.project} and specify the rental period
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rentalPeriod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Rental Period</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="30" id="30days" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="30days">
                          30 days
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="60" id="60days" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="60days">
                          60 days
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="90" id="90days" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="90days">
                          90 days (Default)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" id="custom" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="custom">
                          Custom period
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRentalPeriod === 'custom' && (
              <FormField
                control={form.control}
                name="customDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="customDays">Custom Days (7-365)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="7"
                        max="365"
                        placeholder="Enter number of days"
                        id="customDays"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
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
                disabled={isSubmitting || isProcessing}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    Request Device
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAssignmentDialog;