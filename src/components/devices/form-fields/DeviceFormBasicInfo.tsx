
import React, { useState, useEffect } from 'react';
import { DeviceTypeValue } from '@/types';
import ProjectNameField from './ProjectNameField';
import ProjectGroupSelector from './ProjectGroupSelector';
import DeviceTypeSelector from './DeviceTypeSelector';

interface DeviceFormBasicInfoProps {
  project: string;
  projectGroup: string;
  type: DeviceTypeValue;
  deviceType: 'C-Type' | 'Lunchbox';
  deviceTypes: DeviceTypeValue[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSelectChange: (value: string, field: string) => void;
}

const DeviceFormBasicInfo: React.FC<DeviceFormBasicInfoProps> = ({
  project,
  projectGroup,
  type,
  deviceType,
  deviceTypes,
  handleChange,
  handleSelectChange
}) => {
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('');
  const [newProjectGroup, setNewProjectGroup] = useState('');
  const [projectGroupError, setProjectGroupError] = useState('');

  // Set initial values from props if present
  useEffect(() => {
    if (projectGroup) {
      setSelectedProjectGroup(projectGroup);
    }
  }, [projectGroup]);

  // Handle changing the selected project group from dropdown
  const handleProjectGroupSelect = (value: string) => {
    setSelectedProjectGroup(value);
    setProjectGroupError('');
    setNewProjectGroup('');
    
    // Update deviceData with the selected value
    handleSelectChange(value, 'projectGroup');
  };

  // Handle typing in the new project group field
  const handleNewProjectGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewProjectGroup(value);
    setSelectedProjectGroup('');
    
    // Reset error message when field is cleared
    if (!value.trim()) {
      setProjectGroupError('');
    }
    
    // Update deviceData with new value, overriding any dropdown selection
    handleSelectChange(value, 'projectGroup');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectNameField 
          project={project} 
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
        deviceType={type}
        deviceTypeCategory={deviceType}
        deviceTypes={deviceTypes}
        handleSelectChange={handleSelectChange}
      />
    </div>
  );
};

export default DeviceFormBasicInfo;
