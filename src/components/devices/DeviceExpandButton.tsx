
import React from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

interface DeviceExpandButtonProps {
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const DeviceExpandButton: React.FC<DeviceExpandButtonProps> = ({ expanded, onClick }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center mb-1">
      <button 
        className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors shadow-sm" 
        onClick={onClick}
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        {expanded ? 
          <ChevronsUp className="h-4 w-4" /> : 
          <ChevronsDown className="h-4 w-4" />
        }
      </button>
    </div>
  );
};

export default DeviceExpandButton;
