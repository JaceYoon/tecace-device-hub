
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Database, Loader2 } from 'lucide-react';
import { generateMockDevices } from '@/utils/data/mockDataGenerator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MockDataGeneratorProps {
  onDataGenerated?: () => void;
}

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onDataGenerated }) => {
  const [count, setCount] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (count <= 0 || count > 10000) {
      return;
    }

    setIsGenerating(true);
    try {
      const success = await generateMockDevices({
        count,
        preserveExisting: true,
        batchSize: 50
      });

      if (success && onDataGenerated) {
        // Delay callback to allow for database updates
        setTimeout(() => {
          onDataGenerated();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating mock data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Mock Data Generator
        </CardTitle>
        <CardDescription>
          Generate test devices for stress testing and development
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will create mock devices in your database. Existing data will be preserved.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="device-count">Number of devices to generate</Label>
          <Input
            id="device-count"
            type="number"
            min="1"
            max="10000"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            placeholder="Enter number of devices"
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">
            Maximum: 10,000 devices
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || count <= 0 || count > 10000}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating {count} devices...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Generate {count} Mock Devices
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MockDataGenerator;
