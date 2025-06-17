
import ExcelJS from 'exceljs';
import { Device } from '@/types';
import { applyBorders, styleHeaderRow, generateExcelFile } from './core';

/**
 * Exports devices to an Excel file grouped by project
 */
export const exportDevicesToExcel = (devices: Device[], filename: string = 'Complete_Device_Inventory2.xlsx'): void => {
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
    'Project', 'Device Type', 'IMEI', 'S/N', 'Model Number', 'Received Date', 'Device Status', 'Returned Date'
  ];
  
  // Define column widths with updated values
  worksheet.columns = [
    { header: headers[0], key: 'project', width: 32.5 },
    { header: headers[1], key: 'type', width: 18.5 },
    { header: headers[2], key: 'imei', width: 22.8 },
    { header: headers[3], key: 'sn', width: 20 },
    { header: headers[4], key: 'modelNumber', width: 33.3 },
    { header: headers[5], key: 'receivedDate', width: 17.9 },
    { header: headers[6], key: 'deviceStatus', width: 33.5 },
    { header: headers[7], key: 'returnedDate', width: 22.5 }
  ];
  
  // Style the header row
  styleHeaderRow(worksheet.getRow(1));
  
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
      // Use deviceType (which is C-Type or Lunchbox) or fall back to type if deviceType isn't set
      const displayType = device.deviceType || device.type;
      
      // Format dates in MM/DD/YYYY format
      const formatDate = (dateString?: string | Date): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        // Format as MM/DD/YYYY
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      };
      
      const dataRow = worksheet.addRow({
        project: device.project, // Using project name instead of projectGroup
        type: displayType,
        imei: device.imei || '',
        sn: device.serialNumber || '',
        modelNumber: device.modelNumber || '',
        receivedDate: formatDate(device.receivedDate),
        deviceStatus: device.deviceStatus || '',
        returnedDate: device.status === 'returned' && device.returnDate ? formatDate(device.returnDate) : ''
      });
      
      // Style data row cells with borders
      dataRow.eachCell((cell) => {
        applyBorders(cell);
      });
      
      rowIndex++;
    });
    
    // Add empty row for spacing
    const emptyRow = worksheet.addRow([]);
    
    // Add borders to all cells in the empty row
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(rowIndex, col);
      applyBorders(cell);
    }
    rowIndex++;
    
    // Add project group summary row with Total devices count
    const summaryRow = worksheet.addRow([
      projectGroup, // Project group name
      `Total devices = ${groupDevices.length}`,
      '', '', '', '',
      '', ''
    ]);
    
    // Set row height for summary row
    summaryRow.height = 70;
    
    // Style summary row with #b8c4e4 background and #9C5700 text
    summaryRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB8C4E4' } // Light blue background (#b8c4e4)
      };
      
      // Set default font color to #9C5700
      cell.font = {
        color: { argb: 'FF9C5700' }, // Orange text (#9C5700)
        bold: false // Default to non-bold
      };
      
      // Cell alignment to center
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      applyBorders(cell);
      
      // Special formatting for "Total devices = X" cell
      if (colNumber === 2) {
        cell.font = {
          color: { argb: 'FF9C5700' }, // Orange text (#9C5700)
          bold: true
        };
      }
    });
    
    // Merge cells for "Total devices = X" (columns B-F)
    worksheet.mergeCells(rowIndex, 2, rowIndex, 6);
    
    // Merge cells for empty space (columns G-H)
    worksheet.mergeCells(rowIndex, 7, rowIndex, 8);
    
    rowIndex++;
  });
  
  // Generate and download the Excel file
  generateExcelFile(workbook, filename);
};
