
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
      <Label htmlFor="project">Project Name *</Label>
      <Input
        id="project"
        name="project"
        placeholder="Project Name"
        value={project}
        onChange={handleChange}
        required
        autoComplete="off"
      />
    </div>
  );
};

export default ProjectNameField;
