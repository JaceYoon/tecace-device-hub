
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface NotesFieldProps {
  notes: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ notes, handleChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Input
        id="notes"
        name="notes"
        placeholder="Enter notes"
        value={notes}
        onChange={handleChange}
        autoComplete="off"
        aria-label="Device notes"
      />
    </div>
  );
};

export default NotesField;
