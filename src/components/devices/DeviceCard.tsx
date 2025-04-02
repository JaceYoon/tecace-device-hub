import React, { useState } from 'react';
import { Device, User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { Cpu, Hash, Smartphone, UserIcon, Clock } from 'lucide-react';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import DeviceCardDetails from './DeviceCardDetails';
import DeviceCardActions from './DeviceCardActions';
import DeviceContextMenu from './DeviceContextMenu';
import DeviceDeleteConfirm from './DeviceDeleteConfirm';
import DeviceConfirmDialog from './DeviceConfirmDialog';
import DeviceExpandButton from './DeviceExpandButton';
import DeviceAdminMenu from './DeviceAdminMenu';

interface DeviceCardProps {
  device: Device;
  onAction?: () => void;
  users?: User[];
  className?: string;
  showReturnControls?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  onAction, 
  users = [], 
  className, 
  showReturnControls = false 
}) => {
  const { user, isManager, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean,
    title: string,
    description: string,
    action: () => void
  }>({ isOpen: false, title: '', description: '', action: () => {} });

  const isDeviceOwner = device.assignedTo === user?.id;
  const hasRequested = device.requestedBy === user?.id;
  const isRequested = !!device.requestedBy;
  
  const assignedUser = users.find(u => u.id === device.assignedTo);
  const assignedUserName = assignedUser?.name || device.assignedToName || 'Unknown User';
  
  const requestedByUser = users.find(u => u.id === device.requestedBy);

  console.log(`DeviceCard for ${device.project} - assignedTo: ${device.assignedTo}, found user: ${assignedUser?.name || 'not found'}`);

  const showConfirmation = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action
    });
  };

  const handleRequestDevice = async () => {
    if (!user) return;
    
    if (isRequested) {
      toast.error('This device is already requested');
      return;
    }

    try {
      setIsProcessing(true);
      const requests = await dataService.devices.getAllRequests();
      const userPendingRequests = requests.filter(
        req => req.userId === user.id && 
               req.status === 'pending' && 
               req.type === 'assign'
      );
      
      if (userPendingRequests.some(req => req.deviceId === device.id)) {
        toast.error('You have already requested this device');
        setIsProcessing(false);
        return;
      }
      
      showConfirmation(
        "Request Device",
        `Are you sure you want to request ${device.project}?`,
        async () => {
          try {
            await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });

            toast.success('Device requested successfully');
            if (onAction) onAction();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
          } finally {
            setIsProcessing(false);
          }
        }
      );
    } catch (error) {
      console.error('Error checking existing requests:', error);
      setIsProcessing(false);
      toast.error('Failed to process your request');
    }
  };

  const handleReleaseDevice = () => {
    if (!user) return;

    showConfirmation(
        "Release Device",
        `Are you sure you want to release ${device.project}?`,
        async () => {
          try {
            setIsProcessing(true);
            
            try {
              await dataService.updateDevice(device.id, {
                assignedTo: undefined,
                assignedToId: undefined,
                status: 'available',
              });
              
              try {
                await dataService.addRequest({
                  deviceId: device.id,
                  userId: user.id,
                  status: 'approved',
                  type: 'release',
                });
              } catch (requestError) {
                console.warn('Failed to create release request record:', requestError);
              }
              
              toast.success('Device returned successfully');
              
              if (onAction) {
                onAction();
              }
            } catch (error) {
              console.error('Error updating device status:', error);
              toast.error('Failed to return device');
            }
          } finally {
            setIsProcessing(false);
          }
        }
    );
  };

  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => {
    if (!isAdmin) return;

    showConfirmation(
        `Mark as ${newStatus}`,
        `Are you sure you want to mark this device as ${newStatus}?`,
        () => {
          try {
            dataService.updateDevice(device.id, { status: newStatus });
            toast.success(`Device marked as ${newStatus}`);
            if (onAction) onAction();
          } catch (error) {
            console.error('Error updating device status:', error);
            toast.error('Failed to update device status');
          }
        }
    );
  };

  const handleDeleteDevice = async () => {
    if (!isAdmin) return;
    
    if (deleteConfirmText !== 'confirm') {
      toast.error('Please type "confirm" to delete this device');
      return;
    }

    try {
      setIsDeleting(true);
      const success = await dataService.deleteDevice(device.id);
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');

      if (success) {
        toast.success('Device deleted');
        if (onAction) onAction();
      } else {
        toast.error('Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      setIsDeleting(false);
      toast.error('Failed to delete device');
    }
  };

  const handleDownloadImage = () => {
    if (!device.devicePicture) return;
    
    const link = document.createElement('a');
    link.href = device.devicePicture;
    link.download = `${device.project}_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isRequestedByOthers = device.requestedBy && device.requestedBy !== user?.id;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className={cn(
            "h-full overflow-hidden transition-all duration-300 hover:shadow-soft transform hover:-translate-y-1 flex flex-col relative",
            {
              "border-red-300 bg-red-50/40": device.status === 'stolen',
              "border-amber-300 bg-amber-50/40": device.status === 'missing',
              "border-blue-300 bg-blue-50/40": isRequested && !hasRequested,
              "border-green-300 bg-green-50/40": device.status === 'assigned' && isDeviceOwner,
            },
            className
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-medium">{device.project}</CardTitle>
                  <div className="mt-1">
                    <CardDescription className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      {device.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isAdmin && (
                    <DeviceAdminMenu 
                      device={device}
                      onStatusChange={handleStatusChange}
                      onDelete={() => setDeleteConfirmOpen(true)}
                      onAction={onAction}
                    />
                  )}
                  <StatusBadge status={device.status} />
                  {isRequested && (
                    <span className="text-xs text-amber-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Request Pending
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3 space-y-3 flex-grow">
              {device.status === 'assigned' && (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 p-2 rounded-md">
                  <UserIcon className="h-4 w-4" />
                  <div>
                    <span className="text-xs font-medium">Current Owner</span>
                    <p className="text-sm font-medium">{assignedUserName}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-mono text-xs">{device.serialNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Cpu className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">IMEI</p>
                    <p className="font-mono text-xs">{device.imei || 'N/A'}</p>
                  </div>
                </div>

                {expanded && (
                  <DeviceCardDetails 
                    device={device} 
                    requestedByUser={requestedByUser}
                    isManager={isManager}
                    isAdmin={isAdmin}
                    users={users}
                    onDownloadImage={handleDownloadImage}
                  />
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col space-y-2 mt-auto">
              <DeviceCardActions 
                device={device}
                isAdmin={isAdmin}
                isDeviceOwner={isDeviceOwner}
                hasRequested={hasRequested}
                isRequested={isRequested}
                isRequestedByOthers={isRequestedByOthers}
                isProcessing={isProcessing}
                showReturnControls={showReturnControls}
                userId={user?.id}
                onRequestDevice={handleRequestDevice}
                onReleaseDevice={handleReleaseDevice}
                onStatusChange={handleStatusChange}
                onAction={onAction}
              />
            </CardFooter>
            
            <DeviceExpandButton 
              expanded={expanded} 
              onClick={toggleExpanded} 
            />
          </Card>
        </ContextMenuTrigger>
          
        <DeviceContextMenu 
          device={device} 
          onAction={onAction} 
          onStatusChange={handleStatusChange} 
          onDelete={() => setDeleteConfirmOpen(true)} 
          isAdmin={isAdmin} 
        />
      </ContextMenu>

      <DeviceConfirmDialog
        open={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onCancel={() => {
          setIsProcessing(false);
          setConfirmDialog(prev => ({...prev, isOpen: false}));
        }}
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog(prev => ({...prev, isOpen: false}));
        }}
      />

      <DeviceDeleteConfirm
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        deviceName={device.project}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteConfirmText('');
        }}
        onDelete={handleDeleteDevice}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DeviceCard;
