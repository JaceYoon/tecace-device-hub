
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DeviceExpandButtonProps {
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const DeviceExpandButton: React.FC<DeviceExpandButtonProps> = ({ expanded, onClick }) => {
  return (
    <div className="absolute bottom-2 right-2 pt-10">
      <button 
        className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors" 
        onClick={onClick}
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        {expanded ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </button>
    </div>
  );
};

export default DeviceExpandButton;
