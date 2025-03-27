import { Device, DeviceRequest } from '@/types';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string = 'export.xlsx') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }));
  }
  
  data.forEach(item => {
    worksheet.addRow(item);
  });
  
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF555555' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
  });
  
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
      URL.revokeObjectURL(url);
    }, 0);
  });
};

export const exportDevicesToExcel = (devices: Device[], filename: string = 'Complete_Device_Inventory2.xlsx') => {
  if (!devices || devices.length === 0) {
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Devices');
  
  const devicesByProjectGroup = devices.reduce((acc, device) => {
    const projectGroup = device.projectGroup || 'Unknown';
    if (!acc[projectGroup]) {
      acc[projectGroup] = [];
    }
    acc[projectGroup].push(device);
    return acc;
  }, {} as Record<string, Device[]>);
  
  const headers = [
    'Project', 'Device Type', 'IMEI', 'S/N', 'Notes', 'Received Date', 'Device Status', 'Returned Date'
  ];
  
  worksheet.columns = [
    { header: headers[0], key: 'project', width: 32.5 },
    { header: headers[1], key: 'type', width: 18.5 },
    { header: headers[2], key: 'imei', width: 22.8 },
    { header: headers[3], key: 'sn', width: 20 },
    { header: headers[4], key: 'notes', width: 33.3 },
    { header: headers[5], key: 'receivedDate', width: 17.9 },
    { header: headers[6], key: 'deviceStatus', width: 33.5 },
    { header: headers[7], key: 'returnedDate', width: 22.5 }
  ];
  
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA8A4A4' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };
  
  let rowIndex = 2;
  
  Object.entries(devicesByProjectGroup).forEach(([projectGroup, groupDevices]) => {
    groupDevices.forEach(device => {
      const displayType = device.deviceType || device.type;
      
      const dataRow = worksheet.addRow({
        project: device.project,
        type: displayType,
        imei: device.imei || '',
        sn: device.serialNumber || '',
        notes: device.notes || '',
        receivedDate: device.receivedDate ? new Date(device.receivedDate).toLocaleDateString() : '',
        deviceStatus: device.deviceStatus || '',
        returnedDate: ''
      });
      
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
    
    const emptyRow = worksheet.addRow([]);
    emptyRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(rowIndex, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    }
    rowIndex++;
    
    const summaryRow = worksheet.addRow([
      projectGroup,
      `Total devices = ${groupDevices.length}`,
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    summaryRow.height = 70;
    
    summaryRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB8C4E4' }
      };
      
      cell.font = {
        color: { argb: 'FF9C5700' },
        bold: false
      };
      
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      if (colNumber === 2) {
        cell.font = {
          color: { argb: 'FF9C5700' },
          bold: true
        };
      }
    });
    
    worksheet.mergeCells(rowIndex, 2, rowIndex, 6);
    worksheet.mergeCells(rowIndex, 7, rowIndex, 8);
    
    rowIndex++;
  });
  
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
};

export const exportRequestsToExcel = (requests: DeviceRequest[], filename: string = 'requests.xlsx') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Requests');
  
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
  
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF555555' }
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  
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
  
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex > 1) {
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
  
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 }
  };
  
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
      URL.revokeObjectURL(url);
    }, 0);
  });
};
