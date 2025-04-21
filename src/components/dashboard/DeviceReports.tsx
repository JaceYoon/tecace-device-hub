
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileWarning, ArrowRight } from 'lucide-react';
import { DeviceRequest } from '@/types';
import { format, parseISO } from 'date-fns';
import { dataService } from '@/services/data.service';
import { Badge } from '@/components/ui/badge';

const DeviceReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const allRequests = await dataService.devices.getAllRequests();
        
        // Filter to get only report requests
        const reportRequests = allRequests
          .filter(req => req.type === 'report')
          .sort((a, b) => {
            const dateA = new Date(a.requestedAt).getTime();
            const dateB = new Date(b.requestedAt).getTime();
            return dateB - dateA; // Sort by newest first
          })
          .slice(0, 5); // Get only the 5 most recent reports
        
        setReports(reportRequests);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, []);
  
  const formatDate = (dateString: string | Date) => {
    try {
      return format(
        typeof dateString === 'string' ? parseISO(dateString) : dateString,
        'MMM d, yyyy'
      );
    } catch {
      return 'Invalid date';
    }
  };
  
  const getReportTypeBadge = (reportType: string | undefined) => {
    if (!reportType) return null;
    
    const variant = 
      reportType === 'missing' ? 'secondary' :
      reportType === 'stolen' ? 'destructive' :
      reportType === 'dead' ? 'outline' : 'default';
    
    return <Badge variant={variant}>{reportType}</Badge>;
  };
  
  const handleViewAll = () => {
    navigate('/device-management?tab=reports');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <FileWarning className="h-5 w-5 mr-2 text-amber-500" />
          Device Reports
        </CardTitle>
        <CardDescription>
          Recent device issue reports
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileWarning className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No device reports</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow 
                    key={report.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/device-management?tab=reports&id=${report.id}`)}
                  >
                    <TableCell className="font-medium">
                      {report.device?.project || report.deviceName || 'Unknown Device'}
                    </TableCell>
                    <TableCell>
                      {report.user?.name || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      {getReportTypeBadge(report.reportType)}
                    </TableCell>
                    <TableCell>
                      {formatDate(report.requestedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleViewAll}
        >
          View all reports <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceReports;
