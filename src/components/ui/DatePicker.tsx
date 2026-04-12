"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  bookableDates: string[];
  disabled?: boolean;
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  bookableDates,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const bookableSet = new Set(bookableDates);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
          disabled={disabled}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {formatDate(selected)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toDateString(date));
              setOpen(false);
            }
          }}
          disabled={(date) => !bookableSet.has(toDateString(date))}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
