
import ExcelJS from 'exceljs';

/**
 * Generates and downloads an Excel file
 */
export const generateExcelFile = (workbook: ExcelJS.Workbook, filename: string): void => {
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

/**
 * Applies standard border styling to a cell
 */
export const applyBorders = (cell: ExcelJS.Cell): void => {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
};

/**
 * Styles a header row with standard formatting
 */
export const styleHeaderRow = (headerRow: ExcelJS.Row, bgColor: string = 'FFA8A4A4'): void => {
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' } // White text
    };
    applyBorders(cell);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
};

/**
 * Formats a date to MM/DD/YYYY format for Excel
 */
export const formatDateForExcel = (date: Date | string | null | undefined): string => {
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
