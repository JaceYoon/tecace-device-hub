
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { reportFormSchema, ReportFormValues, useReportForm } from './hooks/useReportForm';
import { UseFormReturn } from 'react-hook-form';

interface ReportDeviceFormProps {
  form: UseFormReturn<ReportFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  onCancel: () => void;
}

const ReportDeviceForm: React.FC<ReportDeviceFormProps> = ({
  form,
  isSubmitting,
  onSubmit,
  onCancel
}) => {
  return (
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
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
        </div>
      </form>
    </Form>
  );
};

export default ReportDeviceForm;
