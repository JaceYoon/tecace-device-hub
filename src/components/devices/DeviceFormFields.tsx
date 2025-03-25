
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
import { Calendar as CalendarIcon, Barcode } from 'lucide-react';
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
  barcode?: string;
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
  // Handle barcode file upload
  const handleBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && handleFileChange) {
      // Read the file as a base64 string
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        handleFileChange(file, 'barcode');
        // Also update the form with the base64 string
        const changeEvent = {
          target: {
            name: 'barcode',
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectGroup">Project Group *</Label>
          <Input
            id="projectGroup"
            name="projectGroup"
            placeholder="Project Group"
            value={deviceData.projectGroup}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Device Type *</Label>
          <Select
            value={deviceData.type}
            onValueChange={(value) => handleSelectChange(value, 'type')}
          >
            <SelectTrigger id="type">
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
          <Label htmlFor="deviceType">Form Factor</Label>
          <Select
            value={deviceData.deviceType}
            onValueChange={(value) => handleSelectChange(value, 'deviceType')}
          >
            <SelectTrigger id="deviceType">
              <SelectValue placeholder="Select Form Factor" />
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
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            placeholder="Serial Number"
            value={deviceData.serialNumber || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imei">IMEI</Label>
          <Input
            id="imei"
            name="imei"
            placeholder="IMEI"
            value={deviceData.imei || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="deviceStatus">Status Details</Label>
          <Input
            id="deviceStatus"
            name="deviceStatus"
            placeholder="Device Status"
            value={deviceData.deviceStatus || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode Image</Label>
        <div className="flex items-center gap-2">
          <Input
            id="barcode"
            name="barcode-upload"
            type="file"
            accept="image/*"
            onChange={handleBarcodeUpload}
            className="flex-1"
          />
          <Barcode className="h-5 w-5 text-muted-foreground" />
        </div>
        {deviceData.barcode && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">Current barcode image:</p>
            <img 
              src={deviceData.barcode} 
              alt="Barcode" 
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
        />
      </div>
    </div>
  );
};

export default DeviceFormFields;
