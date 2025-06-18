
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

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Result = event.target?.result as string;
      console.log('Setting preview image from file');
      setPreviewImage(base64Result);
    };
    reader.readAsDataURL(file);

    // 폼 데이터용 파일 변경 이벤트 호출
    if (onFileChange) {
      console.log('Calling onFileChange with file data');
      onFileChange(e);
    }

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
        
        console.log('=== UPLOAD DEBUG ===');
        console.log('Uploading image to device_images table', {
          deviceId: deviceId,
          deviceIdType: typeof deviceId,
          base64Length: base64Data.length
        });
        
        // deviceId가 문자열인지 확인하고 정수로 변환 가능한지 체크
        const deviceIdInt = parseInt(deviceId!, 10);
        if (isNaN(deviceIdInt)) {
          console.error('❌ Invalid deviceId for upload:', deviceId);
          toast.error('Invalid device ID');
          return;
        }
        
        console.log('Using deviceId for upload:', deviceIdInt);
        
        const response = await fetch(`/api/devices/${deviceIdInt}/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64Data
          })
        });

        console.log('Upload response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Upload successful:', result);
          toast.success('Image uploaded successfully');
          if (onImageUpdate) {
            onImageUpdate();
          }
        } else {
          const error = await response.text();
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
    console.log('=== IMAGE REMOVAL DEBUG START ===');
    console.log('DeviceId:', deviceId);
    console.log('DeviceId type:', typeof deviceId);
    console.log('Is deviceId truthy:', !!deviceId);
    
    // 미리보기 제거
    setPreviewImage(null);
    
    // 파일 입력 필드 리셋
    const fileInput = document.getElementById('devicePicture-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      console.log('File input cleared');
    }

    // 편집 모드일 때 서버에서 완전 삭제
    if (deviceId) {
      try {
        // deviceId가 유효한 숫자인지 확인
        const deviceIdInt = parseInt(deviceId, 10);
        if (isNaN(deviceIdInt)) {
          console.error('❌ Invalid deviceId for removal:', deviceId);
          toast.error('Invalid device ID');
          return;
        }
        
        console.log(`=== CALLING DELETE API ===`);
        console.log(`URL: /api/devices/${deviceIdInt}/images`);
        console.log(`Method: DELETE`);
        console.log(`Using deviceId: ${deviceIdInt} (type: ${typeof deviceIdInt})`);
        
        const response = await fetch(`/api/devices/${deviceIdInt}/images`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Delete API response status:', response.status);
        console.log('Delete API response ok:', response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ 서버 삭제 성공:', result);
          toast.success('Image completely removed from database');
        } else {
          const errorText = await response.text();
          console.error('❌ 서버 삭제 실패 - Status:', response.status);
          console.error('❌ 서버 삭제 실패 - Error text:', errorText);
          toast.error('Failed to remove image from database');
        }
      } catch (error) {
        console.error('❌ 완전 삭제 API 호출 실패:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        toast.error('Failed to remove image');
      }
    } else {
      console.log('No deviceId provided, skipping server deletion');
    }

    // 폼 데이터에서도 이미지 제거
    if (onFileChange) {
      console.log('Calling onFileChange to clear form data');
      
      const clearEvent = {
        target: {
          files: null,
          value: '',
          name: 'devicePicture-upload'
        },
        preventDefault: () => {},
        stopPropagation: () => {},
        nativeEvent: new Event('change'),
        currentTarget: null as any,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        timeStamp: Date.now(),
        type: 'change',
        isDefaultPrevented: () => false,
        isPropagationStopped: () => false,
        persist: () => {}
      } as React.ChangeEvent<HTMLInputElement>;
      
      onFileChange(clearEvent);
    }

    // 콜백 호출
    if (onImageUpdate) {
      console.log('Calling onImageUpdate');
      onImageUpdate();
    }

    console.log('=== IMAGE REMOVAL DEBUG END ===');
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
