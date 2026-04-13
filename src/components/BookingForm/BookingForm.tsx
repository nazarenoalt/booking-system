"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { Duration } from "@/core/models/booking.types";
import { getStartSlots, getValidDurations } from "@/core/utils/time";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/DatePicker";

import type { BookingFormProps, FieldErrors, FormData } from "./types";
import {
  DURATIONS,
  getInitialDate,
  getInitialDuration,
  getInitialStartTime,
} from "./helpers";

export function BookingForm({ bookableDates, booking }: BookingFormProps) {
  const isEditMode = booking !== undefined;
  const router = useRouter();

  // --- Form state ---
  const [form, setForm] = useState<FormData>(() => {
    const duration = getInitialDuration(booking);
    return {
      name: booking?.name ?? "",
      reason: booking?.reason ?? "",
      date: getInitialDate(booking, bookableDates),
      startTime: getInitialStartTime(booking, duration),
      duration,
    };
  });

  // --- UI state ---
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Derived slot/duration lists (re-computed on every render from current state) ---
  const availableSlots = getStartSlots(form.duration);
  const validDurations = getValidDurations(form.startTime);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name in fieldErrors)
      setFieldErrors((p) => ({ ...p, [name]: undefined }));
  }

  function handleDurationChange(value: string) {
    const newDuration = Number(value) as Duration;
    const newSlots = getStartSlots(newDuration);
    setForm((prev) => ({
      ...prev,
      duration: newDuration,
      startTime: newSlots.includes(prev.startTime)
        ? prev.startTime
        : (newSlots[0] ?? "09:00"),
    }));
  }

  function handleStartTimeChange(value: string) {
    const newValidDurations = getValidDurations(value);
    setForm((prev) => ({
      ...prev,
      startTime: value,
      duration: newValidDurations.includes(prev.duration)
        ? prev.duration
        : (newValidDurations[0] ?? 30),
    }));
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.reason.trim()) errors.reason = "Reason is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let response: Response;
      if (isEditMode) {
        response = await fetch(`/api/bookings/${booking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success(isEditMode ? "Appointment updated." : "Appointment booked!");
      router.push("/");
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          name="name"
          onChange={handleChange}
          placeholder="Your full name"
          aria-invalid={!!fieldErrors.name}
          disabled={isSubmitting}
        />
        <ErrorMessage message={fieldErrors.name} />
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={form.reason}
          name="reason"
          onChange={handleChange}
          placeholder="Reason for your visit"
          aria-invalid={!!fieldErrors.reason}
          disabled={isSubmitting}
        />
        <ErrorMessage message={fieldErrors.reason} />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <Label>Date</Label>
        <DatePicker
          value={form.date}
          onChange={(v) => setForm((p) => ({ ...p, date: v }))}
          bookableDates={bookableDates}
          disabled={isSubmitting}
        />
      </div>

      {/* Start Time */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startTime">Start Time</Label>
        <Select
          value={form.startTime}
          onValueChange={handleStartTimeChange}
          disabled={isSubmitting}
        >
          <SelectTrigger id="startTime" className="w-full">
            <SelectValue placeholder="Select a start time" />
          </SelectTrigger>
          <SelectContent>
            {availableSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duration">Duration</Label>
        <Select
          value={String(form.duration)}
          onValueChange={handleDurationChange}
          disabled={isSubmitting}
        >
          <SelectTrigger id="duration" className="w-full">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {(isEditMode ? DURATIONS : validDurations).map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API error */}
      <ErrorMessage message={apiError} />

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Saving…"
          : isEditMode
            ? "Save Changes"
            : "Book Appointment"}
      </Button>
    </form>
  );
}
