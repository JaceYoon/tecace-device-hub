
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Device } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import DeviceHistoryDialog from './DeviceHistoryDialog';

interface DeviceCardProps {
  device: Device;
  onEdit: (deviceId: string) => void;
  className?: string;
  showReturnControls?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, className, showReturnControls }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => dataService.deleteDevice(deviceId),
    onSuccess: () => {
      toast.success('Device deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device.');
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteDeviceMutation.mutate(device.id);
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleViewHistory = () => {
    setIsHistoryDialogOpen(true);
  };

  const handleCloseHistoryDialog = () => {
    setIsHistoryDialogOpen(false);
  };

  return (
    <>
      <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${className || ''}`}>
        <CardHeader>
          <CardTitle>{device.project}</CardTitle>
          <CardDescription>{device.deviceType}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Serial: {device.serialNumber}</p>
          <p>Type: {device.type}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button variant="secondary" onClick={() => navigate(`/device-details/${device.id}`)}>
            View Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(device.id)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewHistory}>
                <Eye className="mr-2 h-4 w-4" /> View History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Delete Device</h2>
            <p className="mb-4">Are you sure you want to delete this device?</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <DeviceHistoryDialog
        deviceId={device.id}
        isOpen={isHistoryDialogOpen}
        onClose={handleCloseHistoryDialog}
      />
    </>
  );
};

export default DeviceCard;
