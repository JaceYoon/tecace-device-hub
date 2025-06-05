
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
      <Label htmlFor="memo">Memo</Label>
      <Textarea
        id="memo"
        name="memo"
        placeholder="Enter memo for this device"
        value={memo}
        onChange={handleChange}
        rows={3}
        autoComplete="off"
        aria-label="Device memo"
      />
    </div>
  );
};

export default MemoField;
