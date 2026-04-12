"use client";

import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/DatePicker";

interface DateSelectorProps {
  selectedDate: string;
  bookableDates: string[];
}

export function DateSelector({ selectedDate, bookableDates }: DateSelectorProps) {
  const router = useRouter();

  return (
    <DatePicker
      value={selectedDate}
      onChange={(date) => router.push(`/?date=${date}`)}
      bookableDates={bookableDates}
    />
  );
}
