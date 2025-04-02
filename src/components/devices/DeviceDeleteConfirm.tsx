
import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeviceDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const DeviceDeleteConfirm: React.FC<DeviceDeleteConfirmProps> = ({
  open,
  onOpenChange,
  deviceName,
  confirmText,
  onConfirmTextChange,
  onCancel,
  onDelete,
  isDeleting
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Device</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            device "{deviceName}" and all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Please type <span className="font-medium text-foreground">confirm</span> to continue:
          </p>
          <Input 
            value={confirmText} 
            onChange={(e) => onConfirmTextChange(e.target.value)} 
            placeholder="confirm"
            className="mb-2"
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDelete}
            disabled={isDeleting || confirmText !== 'confirm'}
          >
            {isDeleting ? (
              <>
                <Clock className="h-4 w-4 mr-1 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Device
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDeleteConfirm;
