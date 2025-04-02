
import React from 'react';
import { Device } from '@/types';
import { AlertCircle, Check, Edit, Flag, Trash2 } from 'lucide-react';
import DeviceEditDialog from './DeviceEditDialog';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface DeviceContextMenuProps {
  device: Device;
  isAdmin: boolean;
  onAction?: () => void;
  onStatusChange: (status: 'missing' | 'stolen' | 'available' | 'dead') => void;
  onDelete: () => void;
}

const DeviceContextMenu: React.FC<DeviceContextMenuProps> = ({
  device,
  isAdmin,
  onAction,
  onStatusChange,
  onDelete
}) => {
  if (!isAdmin) return null;
  
  return (
    <ContextMenuContent>
      <ContextMenuLabel>Device Actions</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onStatusChange('missing')}>
        <Flag className="mr-2 h-4 w-4 text-amber-500" />
        Mark as Missing
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onStatusChange('stolen')}>
        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
        Mark as Stolen
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onStatusChange('dead')}>
        <AlertCircle className="mr-2 h-4 w-4 text-gray-500" />
        Mark as Dead
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onStatusChange('available')}>
        <Check className="mr-2 h-4 w-4 text-green-500" />
        Mark as Available
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDelete}>
        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
        Delete Device
      </ContextMenuItem>
      <DeviceEditDialog 
        device={device} 
        onDeviceUpdated={onAction} 
        triggerElement={
          <ContextMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Edit Device
          </ContextMenuItem>
        }
      />
    </ContextMenuContent>
  );
};

export default DeviceContextMenu;
