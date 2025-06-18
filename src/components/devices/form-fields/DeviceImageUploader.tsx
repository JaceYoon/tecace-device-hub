
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Image, Upload, X, Download } from 'lucide-react';
import { toast } from 'sonner';

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
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // 기존 onFileChange 호출 (폼 데이터용)
    if (onFileChange) {
      onFileChange(e);
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 디바이스 ID가 있고 실제 업로드를 원하는 경우
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
        
        const response = await fetch(`/api/devices/${deviceId}/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64Data,
            mimeType: file.type,
            fileSize: file.size
          })
        });

        if (response.ok) {
          toast.success('Image uploaded successfully');
          if (onImageUpdate) {
            onImageUpdate();
          }
        } else {
          toast.error('Failed to upload image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
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

  const removeImage = () => {
    setPreviewImage(null);
    
    // 파일 입력 필드 리셋
    const fileInput = document.getElementById('devicePicture-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // 폼 데이터에서도 이미지 제거 - 빈 이벤트 객체 생성
    if (onFileChange) {
      const emptyEvent = {
        target: {
          name: 'devicePicture',
          value: '',
          files: null
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onFileChange(emptyEvent);
    }

    // 디바이스 편집 모드에서 이미지 업데이트 콜백 호출
    if (onImageUpdate) {
      onImageUpdate();
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
