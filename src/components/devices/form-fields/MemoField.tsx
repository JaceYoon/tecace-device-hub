
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MemoFieldProps {
  memo: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const MemoField: React.FC<MemoFieldProps> = ({ memo, handleChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes (Optional)</Label>
      <Textarea
        id="notes"
        name="notes"
        placeholder="Enter additional notes about this device..."
        value={memo}
        onChange={handleChange}
        rows={3}
        className="resize-none"
        aria-label="Device notes"
      />
      <p className="text-sm text-muted-foreground">
        Optional field for additional device information
      </p>
    </div>
  );
};

export default MemoField;
