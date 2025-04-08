
import ExcelJS from 'exceljs';
import { DeviceRequest, User } from '@/types';
import { generateExcelFile, styleHeaderRow, applyBorders, formatDateForExcel } from './core';

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
    
    // Format the dates using our new function
    const requestedAt = formatDateForExcel(request.requestedAt);
    const processedAt = formatDateForExcel(request.processedAt);

    worksheet.addRow({
      id: request.id,
      deviceName: request.deviceName || 'Unknown Device',
      type: request.type,
      status: request.status,
      userName: user ? user.name : 'Unknown User',
      requestedAt: requestedAt,
      processedAt: processedAt,
      processedByName: processedByUser ? processedByUser.name : '',
      reason: request.reason || ''
    });
  });

  // Style the header row
  styleHeaderRow(worksheet.getRow(1));

  // Apply borders to all cells
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      applyBorders(cell);
      
      // Center align cells except for reason
      const columnNumber = (cell as any)._column ? (cell as any)._column.number : 0;
      if (columnNumber !== 9) { // Reason column is 9
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // Generate and download the file
  generateExcelFile(workbook, filename);
};
