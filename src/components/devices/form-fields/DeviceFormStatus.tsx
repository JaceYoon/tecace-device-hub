
import React from 'react';
import DateAndStatusFields from './DateAndStatusFields';

interface DeviceFormStatusProps {
  receivedDate?: Date;
  deviceStatus: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleDateChange: (date: Date | undefined, field: string) => void;
}

const DeviceFormStatus: React.FC<DeviceFormStatusProps> = ({
  receivedDate,
  deviceStatus,
  handleChange,
  handleDateChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Status Information</h3>
      <DateAndStatusFields
        receivedDate={receivedDate}
        deviceStatus={deviceStatus}
        handleChange={handleChange}
        handleDateChange={handleDateChange}
      />
    </div>
  );
};

export default DeviceFormStatus;
