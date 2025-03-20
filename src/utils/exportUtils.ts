
import * as XLSX from 'xlsx';
import { Device, DeviceRequest } from '@/types';

export const exportDevicesToExcel = (devices: Device[], filename: string = 'devices.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(
    devices.map(device => ({
      ID: device.id,
      Project: device.project,
      'Device Type': device.type,
      'Device Name': device.deviceName || '',
      IMEI: device.imei,
      'Serial Number': device.serialNumber,
      Status: device.status,
      'Device Status': device.deviceStatus || '',
      'Received Date': device.receivedDate ? new Date(device.receivedDate).toLocaleDateString() : '',
      'Return Date': device.returnDate ? new Date(device.returnDate).toLocaleDateString() : '',
      Assigned: device.assignedTo || 'No',
      Notes: device.notes || '',
      'Created At': new Date(device.createdAt).toLocaleDateString(),
      'Updated At': new Date(device.updatedAt).toLocaleDateString(),
    }))
  );

  // Set column widths
  const maxWidth = 20;
  const colWidths = [
    { wch: 10 }, // ID
    { wch: maxWidth }, // Project
    { wch: maxWidth }, // Device Type
    { wch: maxWidth }, // Device Name
    { wch: 15 }, // IMEI
    { wch: 15 }, // Serial Number
    { wch: 10 }, // Status
    { wch: 15 }, // Device Status
    { wch: 15 }, // Received Date
    { wch: 15 }, // Return Date
    { wch: 10 }, // Assigned
    { wch: maxWidth }, // Notes
    { wch: 12 }, // Created At
    { wch: 12 }, // Updated At
  ];
  
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');
  
  XLSX.writeFile(workbook, filename);
};

export const exportRequestsToExcel = (requests: DeviceRequest[], filename: string = 'requests.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(
    requests.map(request => ({
      ID: request.id,
      'Device ID': request.deviceId,
      'User ID': request.userId,
      Status: request.status,
      Type: request.type,
      'Requested At': new Date(request.requestedAt).toLocaleDateString(),
      'Processed At': request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '',
      'Processed By': request.processedBy || '',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
  
  XLSX.writeFile(workbook, filename);
};
