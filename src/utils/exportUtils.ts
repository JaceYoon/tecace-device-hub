
import ExcelJS from 'exceljs';
import { Device, DeviceRequest, User } from '@/types';

export const exportDevicesToExcel = (devices: Device[], filename: string = 'devices_export.xlsx'): void => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Devices');

  // Define columns
  worksheet.columns = [
    { header: 'Project', key: 'project', width: 20 },
    { header: 'Project Group', key: 'projectGroup', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'IMEI', key: 'imei', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Assigned To', key: 'assignedToName', width: 20 },
    { header: 'Received Date', key: 'receivedDate', width: 15 },
    { header: 'Return Date', key: 'returnDate', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  // Add rows
  devices.forEach(device => {
    // Format dates to MM/DD/YYYY
    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return '';
      
      const d = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(d.getTime())) return '';
      
      // Format as MM/DD/YYYY
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      
      return `${month}/${day}/${year}`;
    };
    
    // Get assigned user name if available
    let assignedToName = '';
    if (device.assignedToName) {
      assignedToName = device.assignedToName;
    } else if (device.assignedTo) {
      // Safely access name property with optional chaining
      if (typeof device.assignedTo === 'object' && device.assignedTo !== null) {
        const assignedToObj = device.assignedTo as unknown as { name?: string };
        assignedToName = assignedToObj?.name || '';
      }
    }

    worksheet.addRow({
      project: device.project,
      projectGroup: device.projectGroup,
      type: device.type,
      serialNumber: device.serialNumber || '',
      imei: device.imei || '',
      status: device.status,
      assignedToName: assignedToName,
      receivedDate: formatDate(device.receivedDate),
      returnDate: formatDate(device.returnDate),
      notes: device.notes || ''
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA8A4A4' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' } // White text
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Apply borders to all cells
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // Center align cells except for notes
      const columnNumber = (cell as any)._column ? (cell as any)._column.number : 0;
      if (columnNumber !== 10) { // Notes column is 10
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // Generate and download the file
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
};

export const exportRequestsToExcel = (requests: DeviceRequest[], users: User[], filename: string = 'requests_export.xlsx'): void => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Device Requests');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Device', key: 'deviceName', width: 25 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'User', key: 'userName', width: 25 },
    { header: 'Requested At', key: 'requestedAt', width: 18 },
    { header: 'Processed At', key: 'processedAt', width: 18 },
    { header: 'Processed By', key: 'processedByName', width: 25 },
    { header: 'Reason', key: 'reason', width: 30 }
  ];

  // Add rows
  requests.forEach(request => {
    // Get user names
    const user = users.find(u => u.id === request.userId);
    const processedByUser = users.find(u => u.id === request.processedBy);
    
    // Format dates to MM/DD/YYYY
    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return '';
      
      const d = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(d.getTime())) return '';
      
      // Format as MM/DD/YYYY
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      
      return `${month}/${day}/${year}`;
    };

    worksheet.addRow({
      id: request.id,
      deviceName: request.deviceName || 'Unknown Device',
      type: request.type,
      status: request.status,
      userName: user ? user.name : 'Unknown User',
      requestedAt: formatDate(request.requestedAt),
      processedAt: formatDate(request.processedAt),
      processedByName: processedByUser ? processedByUser.name : '',
      reason: request.reason || ''
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA8A4A4' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' } // White text
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Apply borders to all cells
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // Center align cells except for reason
      const columnNumber = (cell as any)._column ? (cell as any)._column.number : 0;
      if (columnNumber !== 9) { // Reason column is 9
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // Generate and download the file
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
};
