
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
      <Label htmlFor="modelNumber">Model Number</Label>
      <Input
        id="modelNumber"
        name="modelNumber"
        placeholder="Enter model number"
        value={notes}
        onChange={handleChange}
        autoComplete="off"
        aria-label="Device model number"
      />
    </div>
  );
};

export default NotesField;
