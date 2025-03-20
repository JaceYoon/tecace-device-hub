
import * as XLSX from 'xlsx';
import { Device, DeviceRequest } from '@/types';

export const exportDevicesToExcel = (devices: Device[], filename: string = 'devices.xlsx') => {
  // If no devices, just return
  if (!devices || devices.length === 0) {
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Group devices by projectGroup
  const devicesByProjectGroup = devices.reduce((acc, device) => {
    const projectGroup = device.projectGroup || 'Unknown';
    if (!acc[projectGroup]) {
      acc[projectGroup] = [];
    }
    acc[projectGroup].push(device);
    return acc;
  }, {} as Record<string, Device[]>);
  
  // Define headers and their widths
  const headers = [
    'Project', 'Type', 'IMEI', 'S/N', 'Device Status', 'Received Date', 'Assigned To'
  ];
  
  const colWidths = [
    { wch: 15 }, // Project
    { wch: 15 }, // Type
    { wch: 18 }, // IMEI
    { wch: 15 }, // S/N
    { wch: 30 }, // Device Status
    { wch: 15 }, // Received Date
    { wch: 15 }, // Assigned To
  ];
  
  // Create worksheet data
  const wsData: any[] = [];
  
  // Add header row with styling
  wsData.push(headers);
  
  // Process each project group
  Object.entries(devicesByProjectGroup).forEach(([projectGroup, groupDevices]) => {
    // Add device rows for this project group
    groupDevices.forEach(device => {
      wsData.push([
        device.project,
        device.type,
        device.imei || '',
        device.serialNumber || '',
        device.deviceStatus || '',
        device.receivedDate ? new Date(device.receivedDate).toLocaleDateString() : '',
        device.assignedTo || ''
      ]);
    });
    
    // Add summary row for this project group
    wsData.push([
      `${projectGroup}`,
      '',
      '',
      '',
      `Total devices = ${groupDevices.length}`,
      '',
      ''
    ]);
    
    // Add empty row for spacing between project groups
    wsData.push(Array(headers.length).fill(''));
  });
  
  // Create the worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  worksheet['!cols'] = colWidths;
  
  // Style headers
  const headerStyle = {
    fill: { fgColor: { rgb: "CCCCCC" } },
    font: { bold: true },
    alignment: { horizontal: "center" }
  };
  
  // Style project summary rows - blue with orange text
  const summaryStyle = {
    fill: { fgColor: { rgb: "B4C6E7" } }, // Light blue background
    font: { bold: true, color: { rgb: "E36C09" } } // Orange text
  };
  
  // Apply styles
  let rowIndex = 0;
  wsData.forEach((row, idx) => {
    // Apply header style
    if (idx === 0) {
      for (let i = 0; i < headers.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: i });
        worksheet[cellAddress].s = headerStyle;
      }
    }
    
    // Apply summary style - check if this is a summary row (contains 'Total devices')
    const fifthCell = row[4];
    if (typeof fifthCell === 'string' && fifthCell.includes('Total devices')) {
      for (let i = 0; i < headers.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: i });
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { v: '', s: summaryStyle };
        } else {
          worksheet[cellAddress].s = summaryStyle;
        }
      }
    }
    
    rowIndex++;
  });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');
  
  // Write to file
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
