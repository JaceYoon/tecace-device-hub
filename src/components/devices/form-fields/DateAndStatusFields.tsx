
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateAndStatusFieldsProps {
  receivedDate?: Date;
  deviceStatus: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleDateChange: (date: Date | undefined, field: string) => void;
}

const DateAndStatusFields: React.FC<DateAndStatusFieldsProps> = ({
  receivedDate,
  deviceStatus,
  handleChange,
  handleDateChange
}) => {
  const calendarButtonId = "receivedDate-button";
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={calendarButtonId}>Received Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={calendarButtonId}
              name="receivedDate"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !receivedDate && "text-muted-foreground"
              )}
              aria-label="Select received date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {receivedDate ? format(receivedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={receivedDate}
              onSelect={(date) => handleDateChange(date, 'receivedDate')}
              initialFocus
              aria-label="Date calendar"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deviceStatus">Status *</Label>
        <Input
          id="deviceStatus"
          name="deviceStatus"
          placeholder="Mukundan or Matt"
          value={deviceStatus}
          onChange={handleChange}
          autoComplete="off"
          aria-label="Device status"
        />
      </div>
    </div>
  );
};

export default DateAndStatusFields;
