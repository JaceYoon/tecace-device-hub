
import React, { useState, useEffect } from 'react';
import { DeviceTypeValue } from '@/types';
import ProjectNameField from './form-fields/ProjectNameField';
import ProjectGroupSelector from './form-fields/ProjectGroupSelector';
import DeviceTypeSelector from './form-fields/DeviceTypeSelector';
import DeviceIdentifiers from './form-fields/DeviceIdentifiers';
import DateAndStatusFields from './form-fields/DateAndStatusFields';
import DeviceImageUploader from './form-fields/DeviceImageUploader';
import NotesField from './form-fields/NotesField';

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
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('');
  const [newProjectGroup, setNewProjectGroup] = useState('');
  const [projectGroupError, setProjectGroupError] = useState('');

  // Set initial values from deviceData if present
  useEffect(() => {
    if (deviceData.projectGroup) {
      setSelectedProjectGroup(deviceData.projectGroup);
    }
  }, [deviceData.projectGroup]);

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
      handleSelectChange(value, 'projectGroup');
    }
  };

  // Handle device picture file upload
  const handleDevicePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && handleFileChange) {
      handleFileChange(file, 'devicePicture');
    }
  };

  return (
    <div className="space-y-4" role="group" aria-label="Device information form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectNameField 
          project={deviceData.project} 
          handleChange={handleChange} 
        />

        <ProjectGroupSelector
          selectedGroup={selectedProjectGroup}
          newGroupValue={newProjectGroup}
          handleSelectChange={handleProjectGroupSelect}
          handleNewGroupChange={handleNewProjectGroupChange}
          error={projectGroupError}
        />
      </div>

      <DeviceTypeSelector
        deviceType={deviceData.type}
        deviceTypeCategory={deviceData.deviceType}
        deviceTypes={deviceTypes}
        handleSelectChange={handleSelectChange}
      />

      <DeviceIdentifiers
        serialNumber={deviceData.serialNumber || ''}
        imei={deviceData.imei || ''}
        handleChange={handleChange}
      />

      <DateAndStatusFields
        receivedDate={deviceData.receivedDate}
        deviceStatus={deviceData.deviceStatus || ''}
        handleChange={handleChange}
        handleDateChange={handleDateChange}
      />

      <DeviceImageUploader
        devicePicture={deviceData.devicePicture}
        onFileChange={handleDevicePictureUpload}
      />

      <NotesField
        notes={deviceData.notes || ''}
        handleChange={handleChange}
      />
    </div>
  );
};

export default DeviceFormFields;
