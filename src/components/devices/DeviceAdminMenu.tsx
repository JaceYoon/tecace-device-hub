
import React from 'react';
import { Device } from '@/types';
import { Button } from "@/components/ui/button";
import { MoreVertical, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeviceEditDialog from './DeviceEditDialog';
import { StatusChangeItems } from './StatusChangeItems';

interface DeviceAdminMenuProps {
  device: Device;
  onStatusChange: (status: 'missing' | 'stolen' | 'available' | 'dead') => void;
  onDelete: () => void;
  onAction?: () => void;
}

const DeviceAdminMenu: React.FC<DeviceAdminMenuProps> = ({
  device,
  onStatusChange,
  onDelete,
  onAction
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Device Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <AlertCircle className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              <StatusChangeItems onStatusChange={onStatusChange} />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={onDelete}>
          <DeleteIcon />
          Delete Device
        </DropdownMenuItem>
        <DeviceEditDialog 
          device={device} 
          onDeviceUpdated={onAction} 
          triggerElement={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <EditIcon />
              Edit Device
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Icon components with styling included
const DeleteIcon = () => <Trash2 className="mr-2 h-4 w-4 text-red-500" />;
const EditIcon = () => <Edit className="mr-2 h-4 w-4" />;

import { Trash2, Edit } from 'lucide-react';

export default DeviceAdminMenu;
