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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmShippingDialogProps {
  isOpen: boolean;
  shippingDate: Date;
  confirmText: string;
  isProcessing: boolean;
  selectedCount: number;
  onOpenChange: (open: boolean) => void;
  onDateChange: (date: Date) => void;
  onConfirmTextChange: (text: string) => void;
  onSubmit: () => void;
}

const ConfirmShippingDialog: React.FC<ConfirmShippingDialogProps> = ({
  isOpen,
  shippingDate,
  confirmText,
  isProcessing,
  selectedCount,
  onOpenChange,
  onDateChange,
  onConfirmTextChange,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Device Shipping
          </DialogTitle>
          <DialogDescription>
            You are about to ship {selectedCount} device(s). This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Shipping Date</Label>
            <div className="flex justify-center mt-2">
              <Calendar
                mode="single"
                selected={shippingDate}
                onSelect={(date) => date && onDateChange(date)}
                className="rounded-md border"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="confirm">
              Type "confirm" to proceed with shipping
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder="Type 'confirm' to proceed"
              className="mt-2"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isProcessing || confirmText.toLowerCase() !== 'confirm'}
            variant="destructive"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Shipping...
              </>
            ) : (
              'Confirm Shipping'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmShippingDialog;