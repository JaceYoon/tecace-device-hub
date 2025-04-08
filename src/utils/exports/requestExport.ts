
import ExcelJS from 'exceljs';
import { DeviceRequest } from '@/types';
import { applyBorders, styleHeaderRow, generateExcelFile } from './core';

/**
 * Exports device requests to an Excel file
 */
export const exportRequestsToExcel = (requests: DeviceRequest[], filename: string = 'requests.xlsx'): void => {
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
  styleHeaderRow(worksheet.getRow(1), 'FF555555');
  
  // Format date to MM/DD/YYYY
  const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    // Format as MM/DD/YYYY
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Add request data
  requests.forEach(request => {
    worksheet.addRow({
      id: request.id,
      deviceId: request.deviceId,
      userId: request.userId,
      status: request.status,
      type: request.type,
      requestedAt: formatDate(request.requestedAt),
      processedAt: request.processedAt ? formatDate(request.processedAt) : '',
      processedBy: request.processedBy || ''
    });
  });
  
  // Add borders to all data cells
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex > 1) { // Skip header row which is already styled
      row.eachCell(cell => {
        applyBorders(cell);
      });
    }
  });
  
  // Add autofilter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 }
  };
  
  // Generate and download the Excel file
  generateExcelFile(workbook, filename);
};
