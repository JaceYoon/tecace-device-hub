
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ProjectNameFieldProps {
  project: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ProjectNameField: React.FC<ProjectNameFieldProps> = ({
  project,
  handleChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="project">Device Name *</Label>
      <Input
        id="project"
        name="project"
        placeholder="Enter device name"
        value={project}
        onChange={handleChange}
        required
        autoComplete="off"
        aria-required="true"
        aria-label="Device name"
      />
    </div>
  );
};

export default ProjectNameField;
