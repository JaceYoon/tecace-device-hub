
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DeviceTypeCategory, DeviceTypeValue } from '@/types';
import { cn } from '@/lib/utils';

interface DeviceFormFieldsProps {
  deviceData: {
    project: string;
    projectGroup: string;
    type: DeviceTypeValue;
    deviceType: DeviceTypeCategory;
    imei?: string;
    serialNumber?: string;
    deviceStatus?: string;
    receivedDate?: Date;
    notes?: string;
  };
  deviceTypes: DeviceTypeValue[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string, field: string) => void;
  handleDateChange: (date: Date | undefined, field: string) => void;
  isEditMode?: boolean;
}

const DeviceFormFields: React.FC<DeviceFormFieldsProps> = ({
  deviceData,
  deviceTypes,
  handleChange,
  handleSelectChange,
  handleDateChange,
  isEditMode = false,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="project">Project Name *</Label>
          <Input
            id="project"
            name="project"
            value={deviceData.project}
            onChange={handleChange}
            placeholder="Enter project name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="projectGroup">Project Group *</Label>
          <Input
            id="projectGroup"
            name="projectGroup"
            value={deviceData.projectGroup}
            onChange={handleChange}
            placeholder="Enter project group"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Device Type *</Label>
          <Select 
            value={deviceData.type}
            onValueChange={(value) => handleSelectChange(value, 'type')}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select device type" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deviceType">Device Category *</Label>
          <Select 
            value={deviceData.deviceType}
            onValueChange={(value) => handleSelectChange(value, 'deviceType')}
          >
            <SelectTrigger id="deviceType">
              <SelectValue placeholder="Select device category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="C-Type">C-Type</SelectItem>
              <SelectItem value="Lunchbox">Lunchbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI Number</Label>
          <Input
            id="imei"
            name="imei"
            value={deviceData.imei || ''}
            onChange={handleChange}
            placeholder="Enter IMEI number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={deviceData.serialNumber || ''}
            onChange={handleChange}
            placeholder="Enter serial number"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="deviceStatus">Device Status</Label>
          <Input
            id="deviceStatus"
            name="deviceStatus"
            value={deviceData.deviceStatus || ''}
            onChange={handleChange}
            placeholder="Enter device status"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="receivedDate">Received Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
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
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={deviceData.notes || ''}
          onChange={handleChange}
          placeholder="Enter notes about this device"
          rows={4}
        />
      </div>
    </div>
  );
};

export default DeviceFormFields;
