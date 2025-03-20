
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DeviceFormFieldsProps {
  deviceData: {
    project: string;
    projectGroup: string;
    type: string;
    imei: string;
    serialNumber: string;
    status?: string;
    deviceStatus?: string;
    receivedDate?: Date;
    notes?: string;
  };
  deviceTypes: string[];
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
  isEditMode = false
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project">Project *</Label>
          <Input
            id="project"
            name="project"
            value={deviceData.project}
            onChange={handleChange}
            placeholder="e.g. E1, E2, E3"
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
            placeholder="e.g. Eureka"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Device Type *</Label>
        <Select
          value={deviceData.type}
          onValueChange={(value) => handleSelectChange(value, 'type')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select device type" />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="status">Assignment Status *</Label>
          <Select
            value={deviceData.status}
            onValueChange={(value) => handleSelectChange(value, 'status')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select device status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deviceStatus">Device Status</Label>
          <Input
            id="deviceStatus"
            name="deviceStatus"
            value={deviceData.deviceStatus || ''}
            onChange={handleChange}
            placeholder="e.g. Mukundan or Matt"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receivedDate">Received Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI Number</Label>
          <Input
            id="imei"
            name="imei"
            value={deviceData.imei}
            onChange={handleChange}
            placeholder="15-digit IMEI number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={deviceData.serialNumber}
            onChange={handleChange}
            placeholder="Device serial number"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={deviceData.notes}
          onChange={handleChange}
          placeholder="Additional information about this device"
          rows={3}
        />
      </div>
    </div>
  );
};

export default DeviceFormFields;
