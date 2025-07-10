import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Device } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { deviceService } from '@/services/api/device.service';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';

interface RentalReturnRequestDialogProps {
  device: Device;
  onRequestSubmitted?: () => void;
  trigger?: React.ReactNode;
}

const RentalReturnRequestDialog: React.FC<RentalReturnRequestDialogProps> = ({
  device,
  onRequestSubmitted,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to request a return');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the return request');
      return;
    }

    setIsSubmitting(true);
    try {
      await deviceService.requestDevice(device.id, 'return', {
        reason: reason.trim()
      });

      toast.success('Return request submitted successfully');
      setReason('');
      setIsOpen(false);
      onRequestSubmitted?.();
    } catch (error) {
      console.error('Error submitting return request:', error);
      toast.error('Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className="w-full h-10 font-medium border-amber-300 text-amber-700 hover:bg-amber-50"
      size="sm"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Request Return
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Device Return</DialogTitle>
          <DialogDescription>
            Request that the admin approve a return for this device: <strong>{device.project}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to return this device..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RentalReturnRequestDialog;