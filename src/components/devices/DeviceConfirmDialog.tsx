
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeviceConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeviceConfirmDialog: React.FC<DeviceConfirmDialogProps> = ({
  open,
  title,
  description,
  onCancel,
  onConfirm
}) => {
  // Handle empty dialog cases - don't render if title and description are empty
  if (open && !title && !description) {
    // Force close the dialog by calling onCancel if it's open with empty content
    React.useEffect(() => {
      onCancel();
    }, [onCancel]);
    
    return null;
  }

  const handleConfirm = () => {
    // Call the onConfirm callback
    onConfirm();
  };

  const handleCancel = () => {
    // Call the onCancel callback
    onCancel();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCancel();
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeviceConfirmDialog;
