
import { Device } from '@/types';
import { useDeviceFormState } from './useDeviceFormState';
import { useDeviceFormHandlers } from './useDeviceFormHandlers';
import { useDeviceFormSubmit } from './useDeviceFormSubmit';

interface DeviceEditFormProps {
  device: Device;
  onDeviceUpdated?: () => void;
}

export const useDeviceEditForm = ({ device, onDeviceUpdated }: DeviceEditFormProps) => {
  // Get form state management functionality
  const { deviceData, setDeviceData } = useDeviceFormState(device);
  
  // Get form handlers (change, select, date, file)
  const {
    deviceTypes,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleFileChange
  } = useDeviceFormHandlers(deviceData, setDeviceData);
  
  // Get form submission functionality
  const { handleSubmit } = useDeviceFormSubmit({
    device,
    deviceData,
    setIsSubmitting,
    onDeviceUpdated
  });

  return {
    deviceData,
    deviceTypes,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleFileChange,
    handleSubmit
  };
};
