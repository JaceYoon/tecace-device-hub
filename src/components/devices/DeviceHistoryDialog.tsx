import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, X } from 'lucide-react';
import { dataService } from '@/services/data.service';
import { formatDate } from '@/utils/formatters';
import { toast } from 'sonner';

interface DeviceHistoryEntry {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: string | null;
  releasedAt: string | null;
  releasedById: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

interface DeviceHistoryDialogProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DeviceHistoryDialog: React.FC<DeviceHistoryDialogProps> = ({ deviceId, isOpen, onClose }) => {
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deviceId) {
      fetchDeviceHistory();
    }
  }, [isOpen, deviceId]);

  const fetchDeviceHistory = async () => {
    setIsLoading(true);
    try {
      const historyData = await dataService.getDeviceHistory(deviceId);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching device history:', error);
      toast.error('Failed to load device history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageView = () => {
    setSelectedImage(null);
  };

  const handleDownloadImage = () => {
    if (!selectedImage) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `device-image-${deviceId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Ownership History</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="absolute right-4 top-4 dialog-header-close-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ownership history found for this device.
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`p-4 rounded-lg border ${
                    !entry.releasedAt ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div>
                      <h3 className="font-medium">
                        {entry.userName}
                        {!entry.releasedAt && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-0.5 rounded-full">
                            Current Owner
                          </span>
                        )}
                      </h3>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>
                          <span className="font-medium">Assigned:</span> {formatDate(entry.assignedAt)}
                        </div>
                        
                        {entry.releasedAt && (
                          <div>
                            <span className="font-medium">Released:</span> {formatDate(entry.releasedAt)}
                            {entry.releasedByName && (
                              <span className="ml-1 text-xs">
                                (by {entry.releasedByName})
                              </span>
                            )}
                          </div>
                        )}
                        
                        {entry.releaseReason && (
                          <div className="mt-1 italic">
                            "{entry.releaseReason}"
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {index === 0 ? 'Latest' : `${index + 1}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Image viewer dialog */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-lg">
            <div className="sticky top-0 flex justify-between items-center p-2 bg-white dark:bg-gray-900 border-b">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCloseImageView}
                className="dialog-header-close-button"
              >
                <X className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDownloadImage}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-2">
              <img 
                src={selectedImage} 
                alt="Device" 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeviceHistoryDialog;
