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
  const [showAllDevices, setShowAllDevices] = useState(false);
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
    searchDevices,
    loadAllDevices
  } = useDeviceShipping();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchDevices(searchQuery);
      setHasSearched(true);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'type') {
      setTypeFilter(value);
    } else if (filterType === 'sort') {
      setSortBy(value);
    }
    
    // Auto load devices when filter is applied
    if (value && value !== 'all' && !showAllDevices) {
      setShowAllDevices(true);
      if (!hasSearched) {
        loadAllDevices();
      }
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
                onStatusChange={(value) => handleFilterChange('status', value)}
                typeFilter={typeFilter}
                onTypeChange={(value) => handleFilterChange('type', value)}
                deviceTypes={['Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other']}
                sortBy={sortBy}
                onSortChange={(value) => handleFilterChange('sort', value)}
              />
              
              <Button 
                variant={showAllDevices ? "default" : "outline"}
                onClick={() => {
                  setShowAllDevices(!showAllDevices);
                  if (!showAllDevices && !hasSearched) {
                    loadAllDevices();
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : (showAllDevices ? "Hide All" : "Show All")}
              </Button>
            </CardContent>
          </Card>

          {(hasSearched || showAllDevices || statusFilter !== '' || typeFilter !== '') ? (
            <ShippableDevicesList
              devices={devices.filter(device => {
                // Status filter - match exact status or if "all" is selected
                const matchesStatus = !statusFilter || statusFilter === 'all' || device.status === statusFilter;
                
                // Type filter - match exact type or if "all" is selected
                const matchesType = !typeFilter || typeFilter === 'all' || device.type === typeFilter;
                
                return matchesStatus && matchesType;
              }).sort((a, b) => {
                switch (sortBy) {
                  case 'name':
                    return (a.project || '').localeCompare(b.project || '');
                  case 'type':
                    return (a.type || '').localeCompare(b.type || '');
                  case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                  case 'date':
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                  default:
                    return 0;
                }
              })}
              isLoading={isLoading}
              selectedDevices={selectedDevices}
              onDeviceSelect={handleDeviceSelect}
              onCreateShippingRequests={handleCreateShippingRequests}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Search for devices or apply filters to view shipping options
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the search bar above, apply filters, or click "Show All" to view available devices
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