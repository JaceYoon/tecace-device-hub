
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

const DebouncedInput = React.forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ value, onChange, debounceMs = 300, className, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const isInitialMount = useRef(true);

    // Update local value when external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Debounce the onChange callback
    useEffect(() => {
      // Skip debouncing on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(localValue);
      }, debounceMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [localValue, onChange, debounceMs]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={localValue}
        onChange={handleInputChange}
        className={cn(className)}
      />
    );
  }
);

DebouncedInput.displayName = "DebouncedInput";

export { DebouncedInput };
