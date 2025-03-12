
import { Device, User } from '@/types';
import * as XLSX from 'xlsx';

// Helper to get user name from ID
const getUserNameById = (userId: string | undefined, users: User[]): string => {
  if (!userId) return 'Unassigned';
  const user = users.find((u) => u.id === userId);
  return user ? user.name : 'Unknown User';
};

export const exportDevicesToExcel = (
  devices: Device[],
  users: User[],
  fileName: string,
  isManager: boolean = false
): void => {
  // Filter devices for non-managers (exclude missing/stolen)
  const filteredDevices = isManager 
    ? devices 
    : devices.filter(device => !['missing', 'stolen'].includes(device.status));

  // Create worksheet data
  const worksheetData = filteredDevices.map((device) => ({
    'Device Name': device.name,
    'Device Type': device.type,
    'IMEI': device.imei,
    'Serial Number': device.serialNumber,
    'Status': device.status.charAt(0).toUpperCase() + device.status.slice(1),
    'Current Owner': getUserNameById(device.assignedTo, users),
    ...(isManager && {
      'Added By': getUserNameById(device.addedBy, users),
      'Added Date': new Date(device.createdAt).toLocaleDateString(),
      'Last Updated': new Date(device.updatedAt).toLocaleDateString(),
      'Notes': device.notes || ''
    })
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');

  // Generate file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // Export to file
  XLSX.writeFile(workbook, fullFileName);
};
