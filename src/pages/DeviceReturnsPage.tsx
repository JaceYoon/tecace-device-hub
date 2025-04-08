
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import components
import ReturnableDevicesList from '@/components/returns/ReturnableDevicesList';
import PendingReturnsList from '@/components/returns/PendingReturnsList';
import ReturnedDevicesList from '@/components/returns/ReturnedDevicesList';
import ReturnDateDialog from '@/components/returns/ReturnDateDialog';
import ConfirmReturnsDialog from '@/components/returns/ConfirmReturnsDialog';

// Import refactored hook
import { useDeviceReturns } from '@/hooks/useDeviceReturns';

const DeviceReturnsPage = () => {
  const {
    devices,
    pendingReturnRequests,
    returnedDevices,
    selectedDevices,
    selectedPendingReturns,
    returnDate,
    openReturnDateDialog,
    openConfirmDialog,
    confirmText,
    isProcessing,
    isLoading,
    handleDeviceSelect,
    handlePendingReturnSelect,
    handleCreateReturnRequests,
    submitReturnRequests,
    confirmReturns,
    cancelReturnRequest,
    handleConfirmReturns,
    getDeviceData,
    setReturnDate,
    setOpenReturnDateDialog,
    setOpenConfirmDialog,
    setConfirmText,
    loadData
  } = useDeviceReturns();

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
          <ReturnableDevicesList
            devices={devices}
            isLoading={isLoading}
            selectedDevices={selectedDevices}
            onDeviceSelect={handleDeviceSelect}
            onCreateReturnRequests={handleCreateReturnRequests}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingReturnsList
            pendingReturnRequests={pendingReturnRequests}
            selectedPendingReturns={selectedPendingReturns}
            isLoading={isLoading}
            isProcessing={isProcessing}
            getDeviceData={getDeviceData}
            onPendingReturnSelect={handlePendingReturnSelect}
            onCancelReturnRequest={cancelReturnRequest}
            onConfirmReturns={handleConfirmReturns}
          />
        </TabsContent>
        
        <TabsContent value="returned">
          <ReturnedDevicesList
            returnedDevices={returnedDevices}
            isLoading={isLoading}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
      
      <ReturnDateDialog
        isOpen={openReturnDateDialog}
        returnDate={returnDate}
        isProcessing={isProcessing}
        onOpenChange={setOpenReturnDateDialog}
        onDateChange={(date) => date && setReturnDate(date)}
        onSubmit={submitReturnRequests}
      />
      
      <ConfirmReturnsDialog
        isOpen={openConfirmDialog}
        returnDate={returnDate}
        confirmText={confirmText}
        isProcessing={isProcessing}
        selectedCount={selectedPendingReturns.length}
        onOpenChange={setOpenConfirmDialog}
        onDateChange={(date) => date && setReturnDate(date)}
        onConfirmTextChange={setConfirmText}
        onSubmit={confirmReturns}
      />
    </PageContainer>
  );
};

export default DeviceReturnsPage;
