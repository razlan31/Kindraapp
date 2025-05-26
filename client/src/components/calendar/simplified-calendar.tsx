import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Connection } from "@shared/schema";
import { useState } from "react";

interface SimplifiedCalendarProps {
  selectedConnection?: Connection | null;
  onDateSelect?: (date: Date) => void;
}

export function SimplifiedCalendar({ selectedConnection, onDateSelect }: SimplifiedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {selectedConnection ? `${selectedConnection.name}'s Calendar` : "Calendar"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
        {selectedDate && (
          <div className="mt-3 text-sm text-neutral-600">
            Selected: {selectedDate.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}