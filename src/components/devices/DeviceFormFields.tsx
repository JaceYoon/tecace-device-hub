
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
import { Calendar as CalendarIcon, Image, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/data.service';

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
  const [projectGroupOpen, setProjectGroupOpen] = useState(false);

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
        setProjectGroups(groups.length > 0 ? groups : ['Eureka']);
      } catch (error) {
        console.error('Error fetching project groups:', error);
        setProjectGroups(['Eureka']);
      }
    };
    
    fetchProjectGroups();
  }, []);

  // Handle selecting a project group from the dropdown
  const handleProjectGroupSelect = (value: string) => {
    const changeEvent = {
      target: {
        name: 'projectGroup',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleChange(changeEvent);
    setProjectGroupOpen(false);
  };

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
          <Select
            value={deviceData.projectGroup}
            onValueChange={(value) => handleSelectChange(value, 'projectGroup')}
          >
            <SelectTrigger id="projectGroup" name="projectGroup">
              <SelectValue placeholder="Select Project Group" />
            </SelectTrigger>
            <SelectContent>
              {projectGroups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
