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
import { notificationService } from '@/services/api/notification.service';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

interface AdminReturnRequestDialogProps {
  device: Device;
  onRequestSent?: () => void;
  trigger?: React.ReactNode;
}

const AdminReturnRequestDialog: React.FC<AdminReturnRequestDialogProps> = ({
  device,
  onRequestSent,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!device.assignedToId) {
      toast.error('This device is not assigned to anyone');
      return;
    }

    setIsSending(true);
    try {
      await notificationService.sendReturnRequest(
        device.id, 
        message.trim() || undefined
      );

      toast.success('Return request sent to the device owner');
      setMessage('');
      setIsOpen(false);
      onRequestSent?.();
    } catch (error) {
      console.error('Error sending return request:', error);
      toast.error('Failed to send return request');
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-blue-300 text-blue-700 hover:bg-blue-50"
    >
      <Send className="h-4 w-4 mr-2" />
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
          <DialogTitle>Send Return Request</DialogTitle>
          <DialogDescription>
            Send a return request notification to <strong>{device.assignedToName || 'the assigned user'}</strong> for device: <strong>{device.project}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Please return this device as soon as possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminReturnRequestDialog;