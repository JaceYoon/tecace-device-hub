
import React from 'react';
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
import { Calendar as CalendarIcon, Image } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  // Handle device picture file upload
  const handleDevicePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && handleFileChange) {
      // Read the file as a base64 string
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        handleFileChange(file, 'devicePicture');
        // Also update the form with the base64 string
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
          <Label htmlFor="device-project">Project Name *</Label>
          <Input
            id="device-project"
            name="project"
            placeholder="Project Name"
            value={deviceData.project}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="device-projectGroup">Project Group *</Label>
          <Input
            id="device-projectGroup"
            name="projectGroup"
            placeholder="Galaxy S25 Series, Tablet S10 Series, Galaxy Watch 7 Series and etc.."
            value={deviceData.projectGroup}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device-type">Device Type *</Label>
          <Select
            value={deviceData.type}
            onValueChange={(value) => handleSelectChange(value, 'type')}
            name="type"
          >
            <SelectTrigger id="device-type">
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
          <Label htmlFor="device-deviceType">Type</Label>
          <Select
            value={deviceData.deviceType}
            onValueChange={(value) => handleSelectChange(value, 'deviceType')}
            name="deviceType"
          >
            <SelectTrigger id="device-deviceType">
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
          <Label htmlFor="device-serialNumber">Serial Number</Label>
          <Input
            id="device-serialNumber"
            name="serialNumber"
            placeholder="Serial Number"
            value={deviceData.serialNumber || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="device-imei">IMEI</Label>
          <Input
            id="device-imei"
            name="imei"
            placeholder="IMEI"
            value={deviceData.imei || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device-receivedDate">Received Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="device-receivedDate"
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
          <Label htmlFor="device-deviceStatus">Status</Label>
          <Input
            id="device-deviceStatus"
            name="deviceStatus"
            placeholder="Mukundan or Matt"
            value={deviceData.deviceStatus || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="device-picture">Device Picture</Label>
        <div className="flex items-center gap-2">
          <Input
            id="device-picture"
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
        <Label htmlFor="device-notes">Notes</Label>
        <Textarea
          id="device-notes"
          name="notes"
          placeholder="Additional Notes"
          value={deviceData.notes || ''}
          onChange={handleChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default DeviceFormFields;
