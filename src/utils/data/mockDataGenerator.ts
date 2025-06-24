
import { Device, DeviceStatus, DeviceTypeValue } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

// Device types and categories
const deviceTypes: DeviceTypeValue[] = ['Smartphone', 'Tablet', 'PC', 'Smartwatch', 'Box', 'Accessory', 'Other'];
const deviceCategories = ['C-Type', 'Lunchbox'];
const statuses: DeviceStatus[] = ['available', 'assigned', 'missing', 'stolen'];

// Sample project names and groups
const projectGroups = [
  'Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta', 'Project Epsilon',
  'Mobile Division', 'Enterprise Solutions', 'R&D Labs', 'Quality Assurance', 'Marketing Team'
];

const projectNames = [
  'iPhone 15 Testing', 'Samsung Galaxy Analysis', 'Pixel Performance', 'iPad Pro Review',
  'Surface Tablet Test', 'MacBook Evaluation', 'ThinkPad Assessment', 'Dell Laptop Review',
  'Gaming PC Build', 'Workstation Setup', 'Smart Watch Study', 'Headset Testing',
  'Router Configuration', 'Network Analysis', 'Security Audit', 'Performance Testing'
];

// Generate random IMEI (15 digits)
const generateIMEI = (): string => {
  return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
};

// Generate random serial number
const generateSerialNumber = (prefix: string): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chars = Array.from({ length: 3 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}-${chars}${numbers}`;
};

// Generate model number
const generateModelNumber = (type: DeviceTypeValue): string => {
  const prefixes = {
    'Smartphone': ['SM', 'IP', 'PX', 'OP'],
    'Tablet': ['TB', 'IP', 'SF', 'GA'],
    'PC': ['PC', 'WS', 'DT', 'LT'],
    'Smartwatch': ['SW', 'AW', 'GW', 'FW'],
    'Box': ['BX', 'RT', 'MB', 'SB'],
    'Accessory': ['AC', 'HD', 'CB', 'CH'],
    'Other': ['OT', 'MS', 'PR', 'SC']
  };
  
  const typePrefix = prefixes[type] || ['GN'];
  const prefix = typePrefix[Math.floor(Math.random() * typePrefix.length)];
  const number = Math.floor(Math.random() * 9999) + 1000;
  return `${prefix}-${number}`;
};

// Generate random notes
const generateNotes = (): string | null => {
  const noteTemplates = [
    'Test device for quality assurance',
    'Performance evaluation unit',
    'Development testing device',
    'User experience research',
    'Compatibility testing',
    'Security audit device',
    'Network performance testing',
    'Battery life evaluation',
    null, null, null // 30% chance of no notes
  ];
  
  return noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
};

// Generate random date within last 2 years
const generateRandomDate = (): Date => {
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
  return new Date(randomTime);
};

export interface MockDataOptions {
  count: number;
  preserveExisting?: boolean;
  batchSize?: number;
}

export const generateMockDevices = async (options: MockDataOptions): Promise<boolean> => {
  const { count, preserveExisting = true, batchSize = 50 } = options;
  
  if (count <= 0 || count > 10000) {
    toast.error('Count must be between 1 and 10000');
    return false;
  }
  
  try {
    console.log(`Starting mock data generation for ${count} devices...`);
    toast.info(`Generating ${count} mock devices...`, { duration: 3000 });
    
    // Check existing devices if preserving
    let existingCount = 0;
    if (preserveExisting) {
      try {
        const existingDevices = await dataService.getDevices();
        existingCount = existingDevices.length;
        console.log(`Found ${existingCount} existing devices`);
      } catch (error) {
        console.warn('Could not fetch existing devices, proceeding with generation');
      }
    }
    
    const batches = Math.ceil(count / batchSize);
    let successCount = 0;
    let errorCount = 0;
    
    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
      console.log(`Processing batch ${batch + 1}/${batches} (${currentBatchSize} devices)`);
      
      const batchPromises: Promise<void>[] = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const deviceIndex = (batch * batchSize) + i + 1;
        const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        
        const deviceData = {
          project: `${projectNames[Math.floor(Math.random() * projectNames.length)]} #${deviceIndex}`,
          projectGroup: projectGroups[Math.floor(Math.random() * projectGroups.length)],
          type,
          deviceType: deviceCategories[Math.floor(Math.random() * deviceCategories.length)],
          imei: Math.random() > 0.3 ? generateIMEI() : null, // 70% chance of having IMEI
          serialNumber: generateSerialNumber(type.substring(0, 2).toUpperCase()),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          deviceStatus: Math.random() > 0.5 ? 'Working' : 'Needs Repair',
          receivedDate: generateRandomDate(),
          modelNumber: generateModelNumber(type),
          notes: generateNotes(),
          assignedToId: null, // Keep unassigned for stress testing
          devicePicture: null
        };
        
        const promise = dataService.addDevice(deviceData)
          .then(() => {
            successCount++;
            if (successCount % 100 === 0) {
              console.log(`Generated ${successCount} devices so far...`);
            }
          })
          .catch((error) => {
            errorCount++;
            console.error(`Error creating device ${deviceIndex}:`, error);
          });
        
        batchPromises.push(promise);
      }
      
      // Wait for current batch to complete
      await Promise.all(batchPromises);
      
      // Small delay between batches to prevent overwhelming the server
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Update progress
      const progress = Math.round(((batch + 1) / batches) * 100);
      toast.info(`Progress: ${progress}% (${successCount} created, ${errorCount} errors)`, { 
        duration: 1000 
      });
    }
    
    console.log(`Mock data generation completed: ${successCount} success, ${errorCount} errors`);
    
    if (successCount > 0) {
      toast.success(`Successfully generated ${successCount} mock devices!`, {
        description: errorCount > 0 ? `${errorCount} devices failed to create` : undefined
      });
      return true;
    } else {
      toast.error('Failed to generate any mock devices');
      return false;
    }
    
  } catch (error) {
    console.error('Error during mock data generation:', error);
    toast.error('Failed to generate mock devices');
    return false;
  }
};

export const clearMockDevices = async (): Promise<boolean> => {
  try {
    console.log('WARNING: This would clear all devices. Not implemented for safety.');
    toast.warning('Clear function not implemented for data safety');
    return false;
  } catch (error) {
    console.error('Error clearing mock devices:', error);
    return false;
  }
};
