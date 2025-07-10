import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';

interface ShippingDateDialogProps {
  isOpen: boolean;
  shippingDate: Date;
  isProcessing: boolean;
  onOpenChange: (open: boolean) => void;
  onDateChange: (date: Date) => void;
  onSubmit: () => void;
}

const ShippingDateDialog: React.FC<ShippingDateDialogProps> = ({
  isOpen,
  shippingDate,
  isProcessing,
  onOpenChange,
  onDateChange,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Shipping Date</DialogTitle>
          <DialogDescription>
            Select the date when the devices will be shipped.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={shippingDate}
            onSelect={(date) => date && onDateChange(date)}
            className="rounded-md border"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Shipping Requests'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingDateDialog;