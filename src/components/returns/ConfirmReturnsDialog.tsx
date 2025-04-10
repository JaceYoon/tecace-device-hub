
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { AlertCircle, CalendarIcon } from 'lucide-react';

interface ConfirmReturnsDialogProps {
  isOpen: boolean;
  returnDate: Date;
  confirmText: string;
  isProcessing: boolean;
  selectedCount: number;
  onOpenChange: (open: boolean) => void;
  onDateChange: (date: Date | undefined) => void;
  onConfirmTextChange: (text: string) => void;
  onSubmit: () => void;
}

const ConfirmReturnsDialog: React.FC<ConfirmReturnsDialogProps> = ({
  isOpen,
  returnDate,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Device Returns</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span>Please check the IMEI and S/N again before confirming</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, 'PP') : <span>Pick a return date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={onDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <div className="mb-2 text-sm text-muted-foreground">
              Type "confirm" to proceed with returning {selectedCount} device(s)
            </div>
            <Input
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder="confirm"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isProcessing || confirmText !== 'confirm'}
            className="ml-2"
          >
            {isProcessing ? 'Processing...' : 'Confirm Returns'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmReturnsDialog;
