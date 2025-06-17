
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save } from 'lucide-react';
import { Device } from '@/types';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

interface DeviceMemoDialogProps {
  device: Device;
  onMemoUpdated?: () => void;
}

const DeviceMemoDialog: React.FC<DeviceMemoDialogProps> = ({ 
  device, 
  onMemoUpdated 
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(device.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      await dataService.updateDevice(device.id, { notes });
      toast.success('Notes updated successfully');
      setOpen(false);
      if (onMemoUpdated) {
        onMemoUpdated();
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          {device.notes ? 'Edit Notes' : 'Add Notes'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {device.notes ? 'Edit Notes' : 'Add Notes'} - {device.project}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter notes for this device..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceMemoDialog;
