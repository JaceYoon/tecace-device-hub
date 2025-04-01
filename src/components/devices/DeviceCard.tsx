
import React, { useState } from 'react';
import { Device, User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import {
  AlertCircle, Calendar, ChevronDown, ChevronRight, Cpu,
  Hash, Smartphone, Trash2, User as UserIcon, Check, Clock, Edit, FileText, Box, Image, Download, Flag
} from 'lucide-react';
import { dataService } from '@/services/data.service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import DeviceEditDialog from './DeviceEditDialog';
import { DeviceHistoryDialog } from './DeviceHistoryDialog';
import ReportDeviceDialog from './ReportDeviceDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
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

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

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
      toast.error('This device is already requested', {
        description: 'Please wait until the current request is processed'
      });
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
        toast.error('You have already requested this device', {
          description: 'Please wait for your current request to be processed'
        });
        setIsProcessing(false);
        return;
      }
      
      showConfirmation(
        "Request Device",
        `Are you sure you want to request ${device.project}?`,
        async () => {
          try {
            const request = await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });

            toast.success('Device requested successfully', {
              description: 'Your request has been submitted for approval'
            });
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
            
            // Direct device update approach for better reliability
            try {
              // First update the device status directly
              await dataService.updateDevice(device.id, {
                assignedTo: undefined,
                assignedToId: undefined,
                status: 'available',
              });
              
              // Then create a release request for record-keeping (but with less critical path)
              try {
                await dataService.addRequest({
                  deviceId: device.id,
                  userId: user.id,
                  status: 'approved', // Auto-approve release requests
                  type: 'release',
                });
              } catch (requestError) {
                // If request creation fails, log but don't block the UI update
                console.warn('Failed to create release request record:', requestError);
                // The device is already released, so this is not critical
              }
              
              toast.success('Device returned successfully', {
                description: `You have returned ${device.project}`,
                icon: <Check className="h-4 w-4" />
              });
              
              // Only trigger onAction once to avoid refresh loops
              if (onAction) {
                onAction();
              }
            } catch (error) {
              console.error('Error updating device status:', error);
              toast.error('Failed to return device');
            }
          } catch (error) {
            console.error('Error releasing device:', error);
            toast.error('Failed to return device');
          } finally {
            setIsProcessing(false);
          }
        }
    );
  };

  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available') => {
    if (!isAdmin) return;

    showConfirmation(
        `Mark as ${newStatus}`,
        `Are you sure you want to mark this device as ${newStatus}?`,
        () => {
          try {
            dataService.updateDevice(device.id, { status: newStatus });
            toast.success(`Device marked as ${newStatus}`, {
              description: `The status of ${device.project} has been updated`
            });
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

    showConfirmation(
        "Delete Device",
        "Are you sure you want to permanently delete this device? This action cannot be undone.",
        async () => {
          try {
            setIsDeleting(true);
            console.log('Deleting device:', device.id);
            const success = await dataService.deleteDevice(device.id);
            setIsDeleting(false);

            if (success) {
              toast.success('Device deleted', {
                description: `${device.project} has been permanently removed`
              });
              if (onAction) onAction();
            } else {
              toast.error('Failed to delete device');
            }
          } catch (error) {
            console.error('Error deleting device:', error);
            setIsDeleting(false);
            toast.error('Failed to delete device');
          }
        }
    );
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

  return (
      <>
        <Card className={cn(
            "h-full overflow-hidden transition-all duration-300 hover:shadow-soft transform hover:-translate-y-1 flex flex-col",
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
                <Collapsible open={expanded} onOpenChange={setExpanded}>
                  <CollapsibleTrigger className="flex items-center text-left w-full">
                    <CardTitle className="text-lg font-medium">{device.project}</CardTitle>
                    {expanded ?
                      <ChevronDown className="h-4 w-4 ml-2" /> :
                      <ChevronRight className="h-4 w-4 ml-2" />
                    }
                  </CollapsibleTrigger>
                  <div className="mt-1">
                    <CardDescription className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      {device.type}
                    </CardDescription>
                  </div>
                </Collapsible>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isAdmin && (
                    <DeviceEditDialog device={device} onDeviceUpdated={onAction} />
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

              <Collapsible open={expanded}>
                <CollapsibleContent>
                  <div className="space-y-2 text-sm mt-2 pt-2 border-t">
                    {device.deviceType && (
                      <div className="flex items-start">
                        <Box className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="text-sm">{device.deviceType}</p>
                        </div>
                      </div>
                    )}

                    {device.notes && (
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Notes</p>
                          <p className="text-sm">{device.notes}</p>
                        </div>
                      </div>
                    )}

                    {device.devicePicture && (
                      <div className="flex items-start">
                        <Image className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Device Picture</p>
                          <div className="mt-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <img 
                                  src={device.devicePicture} 
                                  alt="Device Picture" 
                                  className="max-w-full h-auto max-h-24 rounded border border-muted cursor-pointer hover:opacity-80 transition-opacity" 
                                />
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                  <DialogTitle className="flex justify-between items-center">
                                    <span>Device Picture - {device.project}</span>
                                  </DialogTitle>
                                  <DialogDescription>
                                    View full-sized device image
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-2 flex justify-center">
                                  <img 
                                    src={device.devicePicture} 
                                    alt="Device Picture" 
                                    className="max-w-full max-h-[70vh] rounded" 
                                  />
                                </div>
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-1"
                                    onClick={handleDownloadImage}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    )}

                    {requestedByUser && (
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Requested by</p>
                          <p className="text-sm">{requestedByUser.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Last updated</p>
                        <p className="text-xs">{formatDate(device.updatedAt)}</p>
                      </div>
                    </div>
                    
                    {(isManager || isAdmin) && (
                      <div className="mt-2 pt-2 border-t">
                        <DeviceHistoryDialog device={device} users={users} />
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col space-y-2 mt-auto">
            {isAdmin ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {(device.status === 'available' || device.status === 'assigned') && (
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange('missing')}
                          className="text-xs"
                      >
                        Mark Missing
                      </Button>
                  )}

                  {(device.status === 'available' || device.status === 'assigned') && (
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange('stolen')}
                          className="text-xs text-destructive"
                      >
                        Mark Stolen
                      </Button>
                  )}

                  {(device.status === 'missing' || device.status === 'stolen') && (
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange('available')}
                          className="text-xs col-span-2"
                      >
                        Mark as Available
                      </Button>
                  )}

                  <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteDevice}
                      className="text-xs col-span-2 mt-2"
                      disabled={isDeleting}
                  >
                    {isDeleting ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                          Deleting...
                        </>
                    ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Device
                        </>
                    )}
                  </Button>
                </div>
            ) : (
                <>
                  {device.status === 'available' && !isRequested && (
                      <Button
                          className="w-full"
                          size="sm"
                          onClick={handleRequestDevice}
                          disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Request Device
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                  )}

                  {hasRequested && (
                      <Button
                          variant="secondary"
                          className="w-full"
                          size="sm"
                          disabled
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Request Pending
                      </Button>
                  )}

                  {isRequestedByOthers && (
                      <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          disabled
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Already Requested
                      </Button>
                  )}

                  {(isDeviceOwner || showReturnControls) && device.status === 'assigned' && (
                      <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={handleReleaseDevice}
                          disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Return Device</>
                        )}
                      </Button>
                  )}
                  
                  {/* Add Report button for non-admins */}
                  {user && !isAdmin && (
                    <ReportDeviceDialog 
                      device={device} 
                      userId={user.id} 
                      onReportSubmitted={onAction}
                    />
                  )}
                </>
            )}
          </CardFooter>
        </Card>

        <AlertDialog 
          open={confirmDialog.isOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setIsProcessing(false);
              setConfirmDialog(prev => ({...prev, isOpen: false}));
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsProcessing(false);
                setConfirmDialog(prev => ({...prev, isOpen: false}));
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                confirmDialog.action();
                setConfirmDialog(prev => ({...prev, isOpen: false}));
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  );
};

export default DeviceCard;
