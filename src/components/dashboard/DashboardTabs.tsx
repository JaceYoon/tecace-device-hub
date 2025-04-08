
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Package, PackageCheck, Shield } from 'lucide-react';
import DeviceList from '@/components/devices/DeviceList';
import RequestList from '@/components/devices/RequestList';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  myDeviceFilter: string;
  userId: string;
  refreshTrigger: number;
  handleRefresh: () => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  setActiveTab,
  myDeviceFilter,
  userId,
  refreshTrigger,
  handleRefresh
}) => {
  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full max-w-md mb-8">
        <TabsTrigger value="available" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Available
        </TabsTrigger>
        <TabsTrigger value="my-devices" className="flex items-center gap-1">
          <PackageCheck className="h-4 w-4" />
          My Devices
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Requests
        </TabsTrigger>
        <TabsTrigger value="all-devices" className="flex items-center gap-1">
          <Package className="h-4 w-4" />
          All Devices
        </TabsTrigger>
      </TabsList>

      <TabsContent value="available" className="animate-slide-up">
        <DeviceList
          title="Available Devices"
          filterByAvailable={true}
          showExportButton={false}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="my-devices" className="animate-slide-up">
        <DeviceList
          title="My Devices"
          filterByAssignedToUser={myDeviceFilter}
          showControls={false}
          showExportButton={false}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="requests" className="animate-slide-up">
        <RequestList
          title="My Requests"
          userId={userId}
          showExportButton={false}
          onRequestProcessed={handleRefresh}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="all-devices" className="animate-slide-up">
        <DeviceList
          title="All Devices"
          filterByStatus={undefined}
          showExportButton={true}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
