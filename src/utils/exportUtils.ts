
import * as XLSX from 'xlsx';
import { Device, DeviceRequest } from '@/types';

export const exportDevicesToExcel = (devices: Device[], filename: string = 'Complete_Device_Inventory2.xlsx') => {
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
    'Project', 'Device Type', 'IMEI', 'S/N', 'Notes', 'Received Date', 'Device Status', 'Returned Date'
  ];
  
  const colWidths = [
    { wch: 20 }, // Project
    { wch: 15 }, // Device Type
    { wch: 18 }, // IMEI
    { wch: 15 }, // S/N
    { wch: 30 }, // Notes
    { wch: 15 }, // Received Date
    { wch: 20 }, // Device Status
    { wch: 15 }, // Returned Date
  ];
  
  // Create worksheet data
  const wsData: any[] = [];
  
  // Add header row
  wsData.push(headers);
  
  // Process each project group
  Object.entries(devicesByProjectGroup).forEach(([projectGroup, groupDevices]) => {
    // Add device rows for this project group - displaying project name instead of projectGroup
    groupDevices.forEach(device => {
      wsData.push([
        device.project, // Using project name instead of projectGroup
        device.type,
        device.imei || '',
        device.serialNumber || '',
        device.notes || '',
        device.receivedDate ? new Date(device.receivedDate).toLocaleDateString() : '',
        device.deviceStatus || '',
        '' // Placeholder for returned date (not in our data model yet)
      ]);
    });
    
    // Add empty row for spacing
    wsData.push(Array(headers.length).fill(''));
    
    // Add project group summary row with Total devices count
    wsData.push([
      projectGroup, // Project group name
      `Total devices = ${groupDevices.length}`,
      '', '', '', '',
      '', ''
    ]);
    
    // Add empty row for spacing between project groups
    wsData.push(Array(headers.length).fill(''));
  });
  
  // Create the worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  worksheet['!cols'] = colWidths;
  
  // Style configuration
  const headerStyle = {
    fill: { fgColor: { rgb: "D0D0D0" } }, // Gray header
    font: { bold: true, color: { rgb: "000000" } },
    border: {
      top: { style: 'thin', color: { rgb: "000000" } },
      bottom: { style: 'thin', color: { rgb: "000000" } },
      left: { style: 'thin', color: { rgb: "000000" } },
      right: { style: 'thin', color: { rgb: "000000" } }
    },
    alignment: { horizontal: "center", vertical: "center" }
  };
  
  const cellBorderStyle = {
    border: {
      top: { style: 'thin', color: { rgb: "000000" } },
      bottom: { style: 'thin', color: { rgb: "000000" } },
      left: { style: 'thin', color: { rgb: "000000" } },
      right: { style: 'thin', color: { rgb: "000000" } }
    }
  };
  
  // Project group summary style - light blue with orange text
  const summaryRowStyle = {
    fill: { fgColor: { rgb: "B4C6E7" } }, // Light blue background
    font: { bold: true, color: { rgb: "E36C09" } }, // Orange text
    alignment: { horizontal: "left" }
  };
  
  // Project group header style - light blue background
  const groupHeaderStyle = {
    fill: { fgColor: { rgb: "B4C6E7" } }, // Light blue background  
    font: { bold: true, color: { rgb: "996633" } }, // Brown text
    alignment: { horizontal: "center" }
  };
  
  // Apply styles to each cell
  let rowIndex = 0;
  let inGroupHeader = false;
  let currentGroup = '';

  // Track rows that need merged cells
  const merges = [];

  wsData.forEach((row, idx) => {
    // Header row
    if (idx === 0) {
      for (let i = 0; i < headers.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: i });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '' };
        worksheet[cellAddress].s = headerStyle;
      }
    } 
    // Check if this is a summary row (contains 'Total devices')
    else if (row[1] && typeof row[1] === 'string' && row[1].includes('Total devices')) {
      currentGroup = row[0] || currentGroup;
      
      // Apply summary row style
      for (let i = 0; i < headers.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: i });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '' };
        worksheet[cellAddress].s = summaryRowStyle;
      }
      
      // Merge cells for the project group name (column A)
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 0 } });
      
      // Merge cells for "Total devices = X" across columns B-F (1-5)
      merges.push({ s: { r: rowIndex, c: 1 }, e: { r: rowIndex, c: 5 } });
      
      // Merge cells for the empty space in columns G-H (6-7)
      merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });
      
      // Set the next row as the group header
      inGroupHeader = true;
    }
    // Apply group header style to the entire row after a summary row
    else if (inGroupHeader && row.every(cell => cell === '')) {
      inGroupHeader = false;
    }
    // Normal data rows - add borders
    else if (row.some(cell => cell !== '')) {
      for (let i = 0; i < headers.length; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: i });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = cellBorderStyle;
        }
      }
    }
    
    rowIndex++;
  });
  
  // Set the merged cells in the worksheet
  worksheet['!merges'] = merges;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');
  
  // Add autofilter to the header row
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1` };
  
  // Write to file with the specified filename
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
