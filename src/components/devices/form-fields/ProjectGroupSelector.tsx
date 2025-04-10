
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { dataService } from '@/services/data.service';
import { cn } from '@/lib/utils';

interface ProjectGroupSelectorProps {
  selectedGroup: string;
  newGroupValue: string;
  handleSelectChange: (value: string, field: string) => void;
  handleNewGroupChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
}

const ProjectGroupSelector: React.FC<ProjectGroupSelectorProps> = ({
  selectedGroup,
  newGroupValue,
  handleSelectChange,
  handleNewGroupChange,
  error
}) => {
  const [projectGroups, setProjectGroups] = useState<string[]>(['Eureka']);

  // Fetch existing project groups from devices
  useEffect(() => {
    const fetchProjectGroups = async () => {
      try {
        const devices = await dataService.devices.getAll();
        const uniqueGroups = new Set<string>();
        
        devices.forEach(device => {
          if (device.projectGroup && typeof device.projectGroup === 'string' && device.projectGroup.trim() !== '') {
            uniqueGroups.add(device.projectGroup);
          }
        });
        
        const groups = Array.from(uniqueGroups);
        if (groups.length > 0) {
          setProjectGroups(groups);
        } else {
          setProjectGroups(['Eureka']);
        }
      } catch (error) {
        console.error('Error fetching project groups:', error);
        setProjectGroups(['Eureka']);
      }
    };
    
    fetchProjectGroups();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="existing-project-group">Project Group *</Label>
      <div className="space-y-2">
        <Select
          value={selectedGroup || ''}
          onValueChange={(value) => handleSelectChange(value, 'projectGroup')}
        >
          <SelectTrigger 
            id="existing-project-group" 
            name="existingProjectGroup"
            aria-label="Select existing project group"
          >
            <SelectValue placeholder={selectedGroup || "Select existing project group"}>
              {selectedGroup}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projectGroups.map(group => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative">
          <Input
            id="newProjectGroup"
            name="newProjectGroup"
            placeholder="Or type a new project group"
            value={newGroupValue}
            onChange={handleNewGroupChange}
            autoComplete="off"
            className={cn(
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            aria-label="New project group"
            aria-invalid={!!error}
          />
          {error && (
            <div className="text-red-500 text-sm mt-1 flex items-start gap-1" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Either select an existing group or create a new one. Project group cannot be empty.
      </p>
    </div>
  );
};

export default ProjectGroupSelector;
