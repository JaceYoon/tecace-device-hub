
import React from 'react';
import { DeviceTypeValue } from '@/types';
import DeviceFormBasicInfo from './form-fields/DeviceFormBasicInfo';
import DeviceFormIdentifiers from './form-fields/DeviceFormIdentifiers';
import DeviceFormStatus from './form-fields/DeviceFormStatus';
import DeviceFormMedia from './form-fields/DeviceFormMedia';
import MemoField from './form-fields/MemoField';

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
  modelNumber?: string;
  notes?: string;
  devicePicture?: string;
  assignedTo?: any;
  assignedToId?: string;
  assignedToName?: string;
}

interface DeviceFormFieldsProps {
  deviceData: DeviceData;
  deviceTypes: DeviceTypeValue[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSelectChange: (value: string, field: string) => void;
  handleDateChange: (date: Date | undefined, field: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  return (
    <div className="space-y-6" role="group" aria-label="Device information form">
      {/* Basic Info Section */}
      <DeviceFormBasicInfo 
        project={deviceData.project}
        projectGroup={deviceData.projectGroup}
        type={deviceData.type}
        deviceType={deviceData.deviceType}
        deviceTypes={deviceTypes}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
      />

      {/* Identifiers Section - now includes Model Number */}
      <DeviceFormIdentifiers 
        serialNumber={deviceData.serialNumber || ''}
        imei={deviceData.imei || ''}
        modelNumber={deviceData.modelNumber || ''}
        handleChange={handleChange}
      />

      {/* Status Section */}
      <DeviceFormStatus 
        receivedDate={deviceData.receivedDate}
        deviceStatus={deviceData.deviceStatus || ''}
        handleChange={handleChange}
        handleDateChange={handleDateChange}
      />

      {/* Media Section */}
      <DeviceFormMedia 
        devicePicture={deviceData.devicePicture}
        deviceId={isEditMode ? deviceData.assignedToId : undefined}
        onFileChange={handleFileChange}
      />

      {/* Notes Section - moved to the end (previously memo) */}
      <MemoField 
        memo={deviceData.notes || ''}
        handleChange={handleChange}
      />
    </div>
  );
};

export default DeviceFormFields;
