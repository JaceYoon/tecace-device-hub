
import { Device, DeviceRequest } from '@/types';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export const exportDevicesToExcel = (devices: Device[], filename: string = 'Complete_Device_Inventory2.xlsx') => {
  // If no devices, just return
  if (!devices || devices.length === 0) {
    return;
  }

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Devices');
  
  // Group devices by projectGroup
  const devicesByProjectGroup = devices.reduce((acc, device) => {
    const projectGroup = device.projectGroup || 'Unknown';
    if (!acc[projectGroup]) {
      acc[projectGroup] = [];
    }
    acc[projectGroup].push(device);
    return acc;
  }, {} as Record<string, Device[]>);
  
  // Define headers
  const headers = [
    'Project', 'Device Type', 'IMEI', 'S/N', 'Notes', 'Received Date', 'Device Status', 'Returned Date'
  ];
  
  // Define column widths
  worksheet.columns = [
    { header: headers[0], key: 'project', width: 20 },
    { header: headers[1], key: 'type', width: 15 },
    { header: headers[2], key: 'imei', width: 18 },
    { header: headers[3], key: 'sn', width: 15 },
    { header: headers[4], key: 'notes', width: 30 },
    { header: headers[5], key: 'receivedDate', width: 15 },
    { header: headers[6], key: 'deviceStatus', width: 20 },
    { header: headers[7], key: 'returnedDate', width: 15 }
  ];
  
  // Style the header row with darker gray and white text
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF555555' } // Darker gray background
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
  
  // Add autofilter to the header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };
  
  // Current row index (starting after header)
  let rowIndex = 2;
  
  // Process each project group
  Object.entries(devicesByProjectGroup).forEach(([projectGroup, groupDevices]) => {
    // Add device rows for this project group
    groupDevices.forEach(device => {
      const dataRow = worksheet.addRow({
        project: device.project, // Using project name instead of projectGroup
        type: device.type,
        imei: device.imei || '',
        sn: device.serialNumber || '',
        notes: device.notes || '',
        receivedDate: device.receivedDate ? new Date(device.receivedDate).toLocaleDateString() : '',
        deviceStatus: device.deviceStatus || '',
        returnedDate: '' // Placeholder for returned date
      });
      
      // Style data row cells with borders
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      rowIndex++;
    });
    
    // Add empty row for spacing
    worksheet.addRow([]);
    rowIndex++;
    
    // Add project group summary row with Total devices count
    const summaryRow = worksheet.addRow([
      projectGroup, // Project group name
      `Total devices = ${groupDevices.length}`,
      '', '', '', '',
      '', ''
    ]);
    
    // Style summary row with #9C5700 color and centered text
    // Make projectGroup non-bold and "Total devices" partially bold
    summaryRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9C5700' } // Orange color as requested (#9C5700)
      };
      
      // Set default font color to white for better contrast
      cell.font = {
        color: { argb: 'FFFFFFFF' }, // White text
        bold: false // Default to non-bold
      };
      
      // Cell alignment to center
      cell.alignment = { horizontal: 'center' };
      
      // Add borders to all cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // Special formatting for "Total devices = X" cell
      if (colNumber === 2) {
        // This is a workaround since Excel doesn't support partial text formatting in a cell
        // We'll make the cell bold and rely on the visual appearance
        cell.font = {
          color: { argb: 'FFFFFFFF' }, // White text
          bold: true
        };
      }
    });
    
    // Merge cells for "Total devices = X" (columns B-F)
    worksheet.mergeCells(rowIndex, 2, rowIndex, 6);
    
    // Merge cells for empty space (columns G-H)
    worksheet.mergeCells(rowIndex, 7, rowIndex, 8);
    
    rowIndex++;
    
    // Add empty row for spacing between project groups
    worksheet.addRow([]);
    rowIndex++;
  });
  
  // Generate and download the Excel file
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
      URL.revokeObjectURL(url); // Fixed: changed revoObjectURL to revokeObjectURL
    }, 0);
  });
};

export const exportRequestsToExcel = (requests: DeviceRequest[], filename: string = 'requests.xlsx') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Requests');
  
  // Define headers and columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Device ID', key: 'deviceId', width: 15 },
    { header: 'User ID', key: 'userId', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Requested At', key: 'requestedAt', width: 20 },
    { header: 'Processed At', key: 'processedAt', width: 20 },
    { header: 'Processed By', key: 'processedBy', width: 20 }
  ];
  
  // Style the header row with darker gray and white text
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF555555' } // Darker gray background
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
  
  // Add request data
  requests.forEach(request => {
    worksheet.addRow({
      id: request.id,
      deviceId: request.deviceId,
      userId: request.userId,
      status: request.status,
      type: request.type,
      requestedAt: new Date(request.requestedAt).toLocaleDateString(),
      processedAt: request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '',
      processedBy: request.processedBy || ''
    });
  });
  
  // Add borders to all data cells
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex > 1) { // Skip header row which is already styled
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    }
  });
  
  // Add autofilter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 }
  };
  
  // Generate and download the Excel file
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Fixed: changed from revoObjectURL to revokeObjectURL
    }, 0);
  });
};
