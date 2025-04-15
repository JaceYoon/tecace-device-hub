
import { useState } from 'react';

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  description: string;
  action: () => void;
}

export const useConfirmationDialog = () => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
  });

  const showConfirmation = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action
    });
  };

  const closeConfirmation = () => {
    // Important: Reset all values, not just isOpen
    setConfirmDialog({
      isOpen: false,
      title: '',
      description: '',
      action: () => {},
    });
  };

  return {
    confirmDialog,
    showConfirmation,
    closeConfirmation
  };
};
