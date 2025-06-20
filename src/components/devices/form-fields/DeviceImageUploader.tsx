import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Image, Upload, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/services/api/utils';

interface DeviceImageUploaderProps {
  devicePicture?: string;
  deviceId?: string;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpdate?: () => void;
}

const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  devicePicture,
  deviceId,
  onFileChange,
  onImageUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(devicePicture || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    console.log('=== FILE SELECT DEBUG ===');
    console.log('File select event:', {
      hasFile: !!file,
      fileName: file?.name || 'none',
      deviceId: deviceId,
      deviceIdType: typeof deviceId
    });

    if (!file) {
      console.log('No file selected, clearing image');
      setPreviewImage(null);
      if (onFileChange) {
        onFileChange(e);
      }
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Check image file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Result = event.target?.result as string;
      console.log('Setting preview image from file');
      setPreviewImage(base64Result);
    };
    reader.readAsDataURL(file);

    // Call file change event for form data
    if (onFileChange) {
      console.log('Calling onFileChange with file data');
      onFileChange(e);
    }

    // If deviceId exists and wants actual upload
    if (deviceId) {
      await uploadImageToDeviceImages(file);
    }
  };

  const uploadImageToDeviceImages = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        console.log('=== UPLOAD DEBUG ===');
        console.log('Uploading image to device_images table', {
          deviceId: deviceId,
          deviceIdType: typeof deviceId,
          base64Length: base64Data.length
        });
        
        // Validate deviceId exists and is not empty
        if (!deviceId || deviceId === '' || deviceId === 'undefined') {
          console.error('❌ Invalid or empty deviceId for upload:', deviceId);
          toast.error('Invalid device ID');
          return;
        }
        
        console.log('Using deviceId for upload:', deviceId);
        
        try {
          // Use correct server route: /devices/:id/images
          const result = await apiCall(`/devices/${deviceId}/images`, {
            method: 'POST',
            body: JSON.stringify({
              imageData: base64Data
            })
          });

          console.log('✅ Upload successful:', result);
          toast.success('Image uploaded successfully');
          if (onImageUpdate) {
            onImageUpdate();
          }
        } catch (error) {
          console.error('❌ Upload failed:', error);
          toast.error('Failed to upload image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadImage = () => {
    if (!previewImage) return;
    
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `device-${deviceId}-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeImage = async () => {
    console.log('=== IMAGE REMOVAL STARTED ===');
    console.log('DeviceId:', deviceId);
    
    try {
      // 1. Clear preview immediately
      setPreviewImage(null);
      console.log('✅ Preview cleared');
      
      // 2. Reset file input field
      const fileInput = document.getElementById('devicePicture-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
        console.log('✅ File input cleared');
      }

      // 3. Clear form data by creating a proper synthetic event
      if (onFileChange) {
        console.log('Calling onFileChange to clear form data');
        
        // Create a proper synthetic event that mimics clearing a file input
        const syntheticEvent = {
          target: {
            files: null,
            value: '',
            name: 'devicePicture-upload'
          },
          currentTarget: {
            files: null,
            value: '',
            name: 'devicePicture-upload'
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileChange(syntheticEvent);
        console.log('✅ Form data cleared');
      }

      // 4. Delete from server if in edit mode
      if (deviceId) {
        // Validate deviceId exists and is not empty
        if (!deviceId || deviceId === '' || deviceId === 'undefined') {
          console.error('❌ Invalid or empty deviceId for removal:', deviceId);
          toast.error('Invalid device ID');
          return;
        }
        
        console.log(`Calling DELETE API: /devices/${deviceId}/images`);
        
        try {
          // Use correct server route: /devices/:id/images
          const result = await apiCall(`/devices/${deviceId}/images`, {
            method: 'DELETE'
          });

          console.log('✅ Server deletion successful:', result);
          toast.success('Image removed successfully');
        } catch (error) {
          console.error('❌ Server deletion failed:', error);
          toast.error('Failed to remove image from server');
        }
      }

      // 5. Call callback to refresh parent component
      if (onImageUpdate) {
        console.log('Calling onImageUpdate to refresh parent');
        onImageUpdate();
      }

      console.log('✅ Image removal completed successfully');

    } catch (error) {
      console.error('❌ Image removal failed:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="devicePicture-upload">Device Picture</Label>
      
      <div className="flex items-center gap-2">
        <Input
          id="devicePicture-upload"
          name="devicePicture-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="flex-1"
          aria-label="Upload device picture"
          disabled={isUploading}
        />
        <Upload className={`h-5 w-5 ${isUploading ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
      </div>

      {previewImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Device image:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadImage}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
          
          <div className="relative inline-block">
            <img 
              src={previewImage} 
              alt="Device Picture" 
              className="max-w-full h-auto max-h-48 rounded border border-muted shadow-sm" 
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </div>
    </div>
  );
};

export default DeviceImageUploader;
