import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Device, DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, CalendarIcon, AlertCircle, Package, RefreshCw, X } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DeviceReturnsPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingReturnRequests, setPendingReturnRequests] = useState<DeviceRequest[]>([]);
  const [returnedDevices, setReturnedDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPendingReturns, setSelectedPendingReturns] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [openReturnDateDialog, setOpenReturnDateDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('Only administrators can access this page');
    }
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allDevices = await dataService.devices.getAll();
      
      const returnableDevices = allDevices.filter(
        device => device.status === 'available' || device.status === 'dead'
      );
      setDevices(returnableDevices);
      
      const returnedDevs = allDevices.filter(device => device.status === 'returned');
      setReturnedDevices(returnedDevs);
      
      const requests = await dataService.devices.getAllRequests();
      
      const pendingReturns = requests.filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      setPendingReturnRequests(pendingReturns);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId) 
        : [...prev, deviceId]
    );
  };

  const handlePendingReturnSelect = (requestId: string) => {
    setSelectedPendingReturns(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId) 
        : [...prev, requestId]
    );
  };

  const handleCreateReturnRequests = () => {
    if (selectedDevices.length === 0) {
      toast.warning('Please select at least one device');
      return;
    }
    setOpenReturnDateDialog(true);
  };

  const submitReturnRequests = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const deviceId of selectedDevices) {
        try {
          await dataService.devices.requestDevice(
            deviceId,
            'return',
            {
              reason: 'Device returned to warehouse'
            }
          );
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing return for device ${deviceId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) added to return queue`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to queue ${errorCount} device(s) for return`);
      }
      
      setSelectedDevices([]);
      setOpenReturnDateDialog(false);
      
      loadData();
    } catch (error) {
      console.error('Error creating return requests:', error);
      toast.error('Failed to create return requests');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReturns = async () => {
    if (confirmText !== 'confirm') {
      toast.error('Please type "confirm" to proceed');
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const requestId of selectedPendingReturns) {
        try {
          await dataService.devices.processRequest(requestId, 'approved');
          
          const request = pendingReturnRequests.find(r => r.id === requestId);
          if (request) {
            const dateOnly = new Date(returnDate);
            dateOnly.setHours(0, 0, 0, 0);
            
            try {
              await dataService.devices.update(request.deviceId, {
                status: 'returned',
                returnDate: dateOnly,
              });
            } catch (error) {
              console.error(`Error updating status for device ${request.deviceId}:`, error);
            }
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error confirming return for request ${requestId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) returned successfully`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to return ${errorCount} device(s)`);
      }
      
      setSelectedPendingReturns([]);
      setConfirmText('');
      setOpenConfirmDialog(false);
      loadData();
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to process returns');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelReturnRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const request = pendingReturnRequests.find(r => r.id === requestId);
      const deviceId = request?.deviceId;
      
      await dataService.devices.cancelRequest(requestId);
      
      if (deviceId) {
        try {
          await dataService.devices.update(deviceId, {
            status: 'available'
          });
        } catch (error) {
          console.error(`Error updating device ${deviceId} status:`, error);
        }
      }
      
      toast.success('Return request cancelled');
      loadData();
    } catch (error) {
      console.error('Error cancelling return request:', error);
      toast.error('Failed to cancel return request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReturns = () => {
    if (selectedPendingReturns.length === 0) {
      toast.warning('Please select at least one pending return');
      return;
    }
    setOpenConfirmDialog(true);
  };

  const getDeviceData = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId) || 
                   returnedDevices.find(d => d.id === deviceId);
    return device || null;
  };

  return (
    <PageContainer className="py-6">
      <h1 className="text-2xl font-bold mb-6">Device Returns Management</h1>
      <Tabs defaultValue="returnable">
        <TabsList className="mb-4">
          <TabsTrigger value="returnable">Returnable Devices</TabsTrigger>
          <TabsTrigger value="pending">Pending Returns</TabsTrigger>
          <TabsTrigger value="returned">Returned Devices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="returnable">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available & Dead Devices</h2>
            <Button 
              onClick={handleCreateReturnRequests}
              disabled={selectedDevices.length === 0}
            >
              Add Return Request
            </Button>
          </div>
          
          {isLoading ? (
            <p>Loading devices...</p>
          ) : devices.length === 0 ? (
            <p>No returnable devices found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => (
                <Card key={device.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedDevices.includes(device.id)}
                          onCheckedChange={() => handleDeviceSelect(device.id)}
                          id={`device-${device.id}`}
                        />
                        <div>
                          <CardTitle className="text-lg">{device.project}</CardTitle>
                          <CardDescription>{device.type}</CardDescription>
                        </div>
                      </div>
                      <StatusBadge status={device.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Serial Number:</span> 
                        <span className="font-mono">{device.serialNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IMEI:</span>
                        <span className="font-mono">{device.imei || 'N/A'}</span>
                      </div>
                      {device.assignedTo && (
                        <div className="text-amber-600 font-semibold">
                          Note: This device must be released first before returning
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pending Return Requests</h2>
            <Button 
              onClick={handleConfirmReturns}
              disabled={selectedPendingReturns.length === 0}
              variant="outline"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Returns
            </Button>
          </div>
          
          {isLoading ? (
            <p>Loading pending returns...</p>
          ) : pendingReturnRequests.length === 0 ? (
            <p>No pending return requests</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReturnRequests.map(request => {
                const device = getDeviceData(request.deviceId);
                return (
                  <Card key={request.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={selectedPendingReturns.includes(request.id)}
                            onCheckedChange={() => handlePendingReturnSelect(request.id)}
                            id={`request-${request.id}`}
                          />
                          <div>
                            <CardTitle className="text-lg">{device?.project || 'Unknown Device'}</CardTitle>
                            <CardDescription>{device?.type || 'Unknown Type'}</CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => cancelReturnRequest(request.id)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Serial Number:</span> 
                          <span className="font-mono">{device?.serialNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IMEI:</span>
                          <span className="font-mono">{device?.imei || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Requested On:</span> 
                          <span>{request.requestedAt ? format(new Date(request.requestedAt), 'PPP') : 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="returned">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Returned Devices</h2>
            <Button 
              variant="outline" 
              onClick={loadData}
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <p>Loading returned devices...</p>
          ) : returnedDevices.length === 0 ? (
            <p>No returned devices found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {returnedDevices.map(device => (
                <Card key={device.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{device.project}</CardTitle>
                        <CardDescription>{device.type}</CardDescription>
                      </div>
                      <StatusBadge status={device.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Serial Number:</span> 
                        <span className="font-mono">{device.serialNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IMEI:</span>
                        <span className="font-mono">{device.imei || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Return Date:</span> 
                        <span>{device.returnDate ? format(new Date(device.returnDate), 'PP') : 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={openReturnDateDialog} onOpenChange={setOpenReturnDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Return Date</DialogTitle>
            <DialogDescription>
              Select the date when these devices should be returned to the warehouse
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, 'PP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={(date) => date && setReturnDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReturnDateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReturnRequests} 
              disabled={isProcessing}
              className="ml-2"
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Device Returns</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Please check the IMEI and S/N again before confirming
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center py-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, 'PP') : <span>Pick a return date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Type "confirm" to proceed with returning {selectedPendingReturns.length} device(s)
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="confirm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReturns} 
              disabled={isProcessing || confirmText !== 'confirm'}
              className="ml-2"
            >
              {isProcessing ? 'Processing...' : 'Confirm Returns'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default DeviceReturnsPage;
