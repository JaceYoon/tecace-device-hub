import React, { useState } from 'react';
import { Device, User } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import DeviceCardDetails from './DeviceCardDetails';
import DeviceCardActions from './DeviceCardActions';
import DeviceContextMenu from './DeviceContextMenu';
import DeviceDeleteConfirm from './DeviceDeleteConfirm';
import DeviceConfirmDialog from './DeviceConfirmDialog';
import DeviceExpandButton from './DeviceExpandButton';
import DeviceHeader from './DeviceHeader';
import DeviceBasicInfo from './DeviceBasicInfo';
import DeviceAssignmentInfo from './DeviceAssignmentInfo';
import { useDeviceActions } from './hooks/useDeviceActions';

interface DeviceCardProps {
  device: Device;
  onAction?: () => void;
  users?: User[];
  className?: string;
  showReturnControls?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (deviceId: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  onAction, 
  users = [], 
  className, 
  showReturnControls = false,
  isExpanded = false,
  onToggleExpand
}) => {
  const { user, isManager, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  const {
    isDeleting,
    isProcessing,
    deleteConfirmOpen,
    deleteConfirmText,
    confirmDialog,
    setDeleteConfirmOpen,
    setDeleteConfirmText,
    handleRequestDevice,
    handleReleaseDevice,
    handleStatusChange,
    handleDeleteDevice,
    handleDownloadImage,
    showConfirmation
  } = useDeviceActions(device, onAction);

  const isDeviceOwner = device.assignedTo === user?.id;
  const hasRequested = device.requestedBy === user?.id;
  const isRequested = !!device.requestedBy;
  
  const assignedUser = users.find(u => u.id === device.assignedTo);
  const assignedUserName = assignedUser?.name || device.assignedToName || 'Unknown User';
  
  const requestedByUser = users.find(u => u.id === device.requestedBy);

  // Use the prop value if provided, otherwise use internal state
  const displayExpanded = onToggleExpand ? isExpanded : expanded;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand(device.id);
    } else {
      setExpanded(prev => !prev);
    }
  };

  const isRequestedByOthers = device.requestedBy && device.requestedBy !== user?.id;

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
              <DeviceHeader 
                device={device}
                isAdmin={isAdmin}
                isRequested={isRequested}
                onStatusChange={handleStatusChange}
                onDelete={() => setDeleteConfirmOpen(true)}
                onAction={onAction}
              />
            </CardHeader>

            <CardContent className="pb-3 space-y-3 flex-grow">
              <DeviceAssignmentInfo 
                isAssigned={device.status === 'assigned'} 
                assignedUserName={assignedUserName} 
              />

              <DeviceBasicInfo
                serialNumber={device.serialNumber}
                imei={device.imei}
              />

              {displayExpanded && (
                <div className="animate-fade-in">
                  <DeviceCardDetails 
                    device={device} 
                    requestedByUser={requestedByUser}
                    isManager={isManager}
                    isAdmin={isAdmin}
                    users={users}
                    onDownloadImage={handleDownloadImage}
                  />
                </div>
              )}
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
            <div className="absolute bottom-10 left-0 right-0 h-2"></div>
            <DeviceExpandButton 
              expanded={displayExpanded} 
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
          showConfirmation("", "", () => {});
        }}
        onConfirm={() => {
          confirmDialog.action();
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
