
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  onCancel,
  submitText = 'Update Device',
  cancelText = 'Cancel'
}) => {
  return (
    <div className="flex justify-between">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitText === 'Update Device' ? 'Updating...' : 'Submitting...'}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
};

export default FormActions;
