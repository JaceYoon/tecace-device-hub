import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeviceFilters from '@/components/devices/DeviceFilters';

// Import shipping components (renamed from returns)
import ShippableDevicesList from '@/components/shipping/ShippableDevicesList';
import PendingShippingList from '@/components/shipping/PendingShippingList';
import ShippedDevicesList from '@/components/shipping/ShippedDevicesList';
import ShippingDateDialog from '@/components/shipping/ShippingDateDialog';
import ConfirmShippingDialog from '@/components/shipping/ConfirmShippingDialog';

// Import refactored hook
import { useDeviceShipping } from '@/hooks/useDeviceShipping';

const DeviceShippingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const {
    devices,
    pendingShippingRequests,
    shippedDevices,
    selectedDevices,
    selectedPendingShipping,
    shippingDate,
    openShippingDateDialog,
    openConfirmDialog,
    confirmText,
    isProcessing,
    isLoading,
    handleDeviceSelect,
    handlePendingShippingSelect,
    handleCreateShippingRequests,
    submitShippingRequests,
    confirmShipping,
    cancelShippingRequest,
    handleConfirmShipping,
    getDeviceData,
    setShippingDate,
    setOpenShippingDateDialog,
    setOpenConfirmDialog,
    setConfirmText,
    loadData,
    searchDevices
  } = useDeviceShipping();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchDevices(searchQuery);
      setHasSearched(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <PageContainer className="py-6">
      <h1 className="text-2xl font-bold mb-6">Device Shipping Management</h1>
      
      <Tabs defaultValue="shippable">
        <TabsList className="mb-4">
          <TabsTrigger value="shippable">Shippable Devices</TabsTrigger>
          <TabsTrigger value="pending">Pending Shipping</TabsTrigger>
          <TabsTrigger value="shipped">Shipped Devices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shippable">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Devices for Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by device name, model, or serial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <DeviceFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                deviceTypes={[]}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </CardContent>
          </Card>

          {hasSearched && (
            <ShippableDevicesList
              devices={devices}
              isLoading={isLoading}
              selectedDevices={selectedDevices}
              onDeviceSelect={handleDeviceSelect}
              onCreateShippingRequests={handleCreateShippingRequests}
            />
          )}

          {!hasSearched && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Use the search above to find devices for shipping
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingShippingList
            pendingShippingRequests={pendingShippingRequests}
            selectedPendingShipping={selectedPendingShipping}
            isLoading={isLoading}
            isProcessing={isProcessing}
            getDeviceData={getDeviceData}
            onPendingShippingSelect={handlePendingShippingSelect}
            onCancelShippingRequest={cancelShippingRequest}
            onConfirmShipping={handleConfirmShipping}
          />
        </TabsContent>
        
        <TabsContent value="shipped">
          <ShippedDevicesList
            shippedDevices={shippedDevices}
            isLoading={isLoading}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
      
      <ShippingDateDialog
        isOpen={openShippingDateDialog}
        shippingDate={shippingDate}
        isProcessing={isProcessing}
        onOpenChange={setOpenShippingDateDialog}
        onDateChange={(date) => date && setShippingDate(date)}
        onSubmit={submitShippingRequests}
      />
      
      <ConfirmShippingDialog
        isOpen={openConfirmDialog}
        shippingDate={shippingDate}
        confirmText={confirmText}
        isProcessing={isProcessing}
        selectedCount={selectedPendingShipping.length}
        onOpenChange={setOpenConfirmDialog}
        onDateChange={(date) => date && setShippingDate(date)}
        onConfirmTextChange={setConfirmText}
        onSubmit={confirmShipping}
      />
    </PageContainer>
  );
};

export default DeviceShippingPage;