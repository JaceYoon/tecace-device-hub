
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
    action: () => {} 
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
    // Copy the current dialog before closing
    const currentDialog = { ...confirmDialog };
    
    // First update the isOpen state (this makes it disappear)
    setConfirmDialog({
      ...currentDialog,
      isOpen: false
    });
    
    // Then schedule a delayed clearing of other properties to avoid UI glitches
    setTimeout(() => {
      setConfirmDialog({
        isOpen: false,
        title: '',
        description: '',
        action: () => {}
      });
    }, 300);
  };

  return {
    confirmDialog,
    showConfirmation,
    closeConfirmation
  };
};
