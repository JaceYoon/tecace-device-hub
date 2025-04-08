
import ExcelJS from 'exceljs';
import { Device, User } from '@/types';
import { generateExcelFile, styleHeaderRow, applyBorders, formatDateForExcel } from './core';

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
    // Format the dates using our new function
    const receivedDate = formatDateForExcel(device.receivedDate);
    const returnDate = formatDateForExcel(device.returnDate);
    
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
      receivedDate: receivedDate,
      returnDate: returnDate,
      notes: device.notes || ''
    });
  });

  // Style the header row
  styleHeaderRow(worksheet.getRow(1));

  // Apply borders to all cells
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      applyBorders(cell);
      
      // Center align cells except for notes
      const columnNumber = (cell as any).col || 0;
      if (columnNumber !== 10) { // Notes column is 10
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // Generate and download the file
  generateExcelFile(workbook, filename);
};
