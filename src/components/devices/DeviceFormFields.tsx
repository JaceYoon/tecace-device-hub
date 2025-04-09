
import React, { useState, useEffect } from 'react';
import { DeviceTypeValue } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Image, ChevronDown, Check, Plus, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface DeviceData {
  project: string;
  projectGroup: string;
  type: DeviceTypeValue;
  deviceType: 'C-Type' | 'Lunchbox';
  imei?: string;
  serialNumber?: string;
  status?: string;
  deviceStatus?: string;
  receivedDate?: Date;
  notes?: string;
  devicePicture?: string;
}

interface DeviceFormFieldsProps {
  deviceData: DeviceData;
  deviceTypes: DeviceTypeValue[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSelectChange: (value: string, field: string) => void;
  handleDateChange: (date: Date | undefined, field: string) => void;
  handleFileChange?: (file: File | null, field: string) => void;
  isEditMode?: boolean;
}

const DeviceFormFields: React.FC<DeviceFormFieldsProps> = ({
  deviceData,
  deviceTypes,
  handleChange,
  handleSelectChange,
  handleDateChange,
  handleFileChange,
  isEditMode = false
}) => {
  const [projectGroups, setProjectGroups] = useState<string[]>(['Eureka']);
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('');
  const [newProjectGroup, setNewProjectGroup] = useState('');
  const [openProjectGroup, setOpenProjectGroup] = useState(false);
  const [projectGroupError, setProjectGroupError] = useState('');

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
  
  // Set initial values from deviceData if present
  useEffect(() => {
    if (deviceData.projectGroup) {
      setSelectedProjectGroup(deviceData.projectGroup);
    }
  }, [deviceData.projectGroup]);

  // Normalize group name (convert to lowercase and remove spaces) for comparison
  const normalizeGroupName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '');
  };

  // Check if a group name already exists (case-insensitive, ignoring spaces)
  const groupExists = (name: string) => {
    const normalizedName = normalizeGroupName(name);
    return projectGroups.some(group => normalizeGroupName(group) === normalizedName);
  };

  // Handle changing the selected project group from dropdown
  const handleProjectGroupSelect = (value: string) => {
    setSelectedProjectGroup(value);
    setProjectGroupError('');
    
    // If new project group is empty, update deviceData
    if (!newProjectGroup.trim()) {
      handleSelectChange(value, 'projectGroup');
    }
  };

  // Handle typing in the new project group field
  const handleNewProjectGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewProjectGroup(value);
    
    // Reset error message when field is cleared
    if (!value.trim()) {
      setProjectGroupError('');
    }
    
    // Update deviceData with new value, overriding any dropdown selection
    if (value.trim()) {
      // Check if the group already exists
      if (groupExists(value)) {
        setProjectGroupError(`Project group "${value}" already exists. Please select it from the dropdown instead.`);
      } else {
        setProjectGroupError('');
        handleSelectChange(value, 'projectGroup');
      }
    }
  };

  // Validate form on submit - called by parent component
  useEffect(() => {
    // Validate that a project group is selected
    if (!deviceData.projectGroup) {
      if (newProjectGroup.trim()) {
        handleSelectChange(newProjectGroup, 'projectGroup');
      } else if (selectedProjectGroup) {
        handleSelectChange(selectedProjectGroup, 'projectGroup');
      }
    }
  }, [deviceData.projectGroup, newProjectGroup, selectedProjectGroup]);

  // Handle device picture file upload
  const handleDevicePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && handleFileChange) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        handleFileChange(file, 'devicePicture');
        const changeEvent = {
          target: {
            name: 'devicePicture',
            value: base64String
          }
        } as React.ChangeEvent<HTMLInputElement>;
        handleChange(changeEvent);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project">Project Name *</Label>
          <Input
            id="project"
            name="project"
            placeholder="Project Name"
            value={deviceData.project}
            onChange={handleChange}
            required
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectGroup">Project Group *</Label>
          <div className="space-y-2">
            <Select
              value={selectedProjectGroup}
              onValueChange={handleProjectGroupSelect}
            >
              <SelectTrigger id="existingProjectGroup" name="existingProjectGroup">
                <SelectValue placeholder="Select existing project group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select project group</SelectItem>
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
                value={newProjectGroup}
                onChange={handleNewProjectGroupChange}
                autoComplete="off"
                className={cn(
                  projectGroupError && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {projectGroupError && (
                <div className="text-red-500 text-sm mt-1 flex items-start gap-1">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{projectGroupError}</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            Either select an existing group or create a new one. Project group cannot be empty.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Device Type *</Label>
          <Select
            value={deviceData.type}
            onValueChange={(value) => handleSelectChange(value, 'type')}
          >
            <SelectTrigger id="type" name="type">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceType">Type</Label>
          <Select
            value={deviceData.deviceType}
            onValueChange={(value) => handleSelectChange(value, 'deviceType')}
          >
            <SelectTrigger id="deviceType" name="deviceType">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="C-Type">C-Type</SelectItem>
              <SelectItem value="Lunchbox">Lunchbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number (Alphanumeric only)</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            placeholder="Serial Number"
            value={deviceData.serialNumber || ''}
            onChange={handleChange}
            pattern="[a-zA-Z0-9]*"
            title="Only letters and numbers are allowed"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imei">IMEI (15 digits only)</Label>
          <Input
            id="imei"
            name="imei"
            placeholder="15-digit IMEI number"
            value={deviceData.imei || ''}
            onChange={handleChange}
            pattern="\d{15}"
            title="IMEI must be exactly 15 digits"
            maxLength={15}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="receivedDate">Received Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="receivedDate"
                name="receivedDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deviceData.receivedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deviceData.receivedDate ? format(deviceData.receivedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={deviceData.receivedDate}
                onSelect={(date) => handleDateChange(date, 'receivedDate')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceStatus">Status</Label>
          <Input
            id="deviceStatus"
            name="deviceStatus"
            placeholder="Mukundan or Matt"
            value={deviceData.deviceStatus || ''}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="devicePicture">Device Picture</Label>
        <div className="flex items-center gap-2">
          <Input
            id="devicePicture"
            name="devicePicture-upload"
            type="file"
            accept="image/*"
            onChange={handleDevicePictureUpload}
            className="flex-1"
          />
          <Image className="h-5 w-5 text-muted-foreground" />
        </div>
        {deviceData.devicePicture && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">Current device picture:</p>
            <img 
              src={deviceData.devicePicture} 
              alt="Device Picture" 
              className="max-w-full h-auto max-h-24 rounded border border-muted" 
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Additional Notes"
          value={deviceData.notes || ''}
          onChange={handleChange}
          rows={3}
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export default DeviceFormFields;
