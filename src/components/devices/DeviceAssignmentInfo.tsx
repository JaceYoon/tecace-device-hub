
import React from 'react';
import { UserIcon } from 'lucide-react';

interface DeviceAssignmentInfoProps {
  isAssigned: boolean;
  assignedUserName: string;
}

const DeviceAssignmentInfo: React.FC<DeviceAssignmentInfoProps> = ({
  isAssigned,
  assignedUserName
}) => {
  if (!isAssigned) return null;
  
  return (
    <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-white p-2 rounded-md">
      <UserIcon className="h-4 w-4" />
      <div>
        <span className="text-xs font-medium">Current Owner</span>
        <p className="text-sm font-medium truncate max-w-[200px]">{assignedUserName}</p>
      </div>
    </div>
  );
};

export default DeviceAssignmentInfo;
