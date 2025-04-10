
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  notes: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ notes, handleChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        name="notes"
        placeholder="Enter additional notes about this device"
        value={notes}
        onChange={handleChange}
        rows={3}
        autoComplete="off"
        aria-label="Device notes"
      />
    </div>
  );
};

export default NotesField;
