import { describe, it, expect, vi, afterEach } from "vitest";
import {
  toMinutes,
  toTimeString,
  addMinutes,
  getStartSlots,
  getValidDurations,
  checkOverlap,
  toDateString,
  today,
  getBookableDates,
  CLINIC_START,
  CLINIC_END,
} from "./time";

describe("toMinutes", () => {
  it("converts midnight to 0", () => {
    expect(toMinutes("00:00")).toBe(0);
  });

  it("converts clinic start to 540", () => {
    expect(toMinutes("09:00")).toBe(540);
  });

  it("converts clinic end to 1080", () => {
    expect(toMinutes("18:00")).toBe(1080);
  });

  it("converts a time with non-zero minutes", () => {
    expect(toMinutes("09:30")).toBe(570);
  });

  it("converts end of day to 1439", () => {
    expect(toMinutes("23:59")).toBe(1439);
  });
});

describe("toTimeString", () => {
  it("converts 0 to 00:00", () => {
    expect(toTimeString(0)).toBe("00:00");
  });

  it("converts 540 to 09:00", () => {
    expect(toTimeString(540)).toBe("09:00");
  });

  it("converts 570 to 09:30", () => {
    expect(toTimeString(570)).toBe("09:30");
  });

  it("pads single-digit hours with a leading zero", () => {
    expect(toTimeString(60)).toBe("01:00");
  });

  it("pads single-digit minutes with a leading zero", () => {
    expect(toTimeString(541)).toBe("09:01");
  });

  it("converts 1080 to 18:00", () => {
    expect(toTimeString(1080)).toBe("18:00");
  });
});

describe("addMinutes", () => {
  it("adds 30 minutes to 09:00", () => {
    expect(addMinutes("09:00", 30)).toBe("09:30");
  });

  it("adds 60 minutes to 09:00", () => {
    expect(addMinutes("09:00", 60)).toBe("10:00");
  });

  it("adds 0 minutes, returns same time", () => {
    expect(addMinutes("09:00", 0)).toBe("09:00");
  });

  it("rolls over past the hour boundary correctly", () => {
    expect(addMinutes("09:45", 30)).toBe("10:15");
  });
});

describe("getStartSlots", () => {
  it("first slot is clinic start (09:00) when no duration given", () => {
    const slots = getStartSlots();
    expect(slots[0]).toBe(CLINIC_START);
  });

  it("last slot is 17:30 when no duration given (default 30-min filter)", () => {
    const slots = getStartSlots();
    expect(slots[slots.length - 1]).toBe("17:30");
  });

  it("returns 18 slots when no duration given", () => {
    expect(getStartSlots()).toHaveLength(18);
  });

  it("first slot is 09:00 with duration 30", () => {
    expect(getStartSlots(30)[0]).toBe("09:00");
  });

  it("last slot is 17:30 with duration 30", () => {
    const slots = getStartSlots(30);
    expect(slots[slots.length - 1]).toBe("17:30");
  });

  it("returns 18 slots with duration 30", () => {
    expect(getStartSlots(30)).toHaveLength(18);
  });

  it("first slot is 09:00 with duration 45", () => {
    expect(getStartSlots(45)[0]).toBe("09:00");
  });

  it("last slot is 17:00 with duration 45", () => {
    const slots = getStartSlots(45);
    expect(slots[slots.length - 1]).toBe("17:00");
  });

  it("returns 17 slots with duration 45", () => {
    expect(getStartSlots(45)).toHaveLength(17);
  });

  it("first slot is 09:00 with duration 60", () => {
    expect(getStartSlots(60)[0]).toBe("09:00");
  });

  it("last slot is 17:00 with duration 60", () => {
    const slots = getStartSlots(60);
    expect(slots[slots.length - 1]).toBe("17:00");
  });

  it("returns 17 slots with duration 60", () => {
    expect(getStartSlots(60)).toHaveLength(17);
  });

  it("slots are spaced SLOT_INTERVAL_MINUTES (30 min) apart", () => {
    const slots = getStartSlots();
    for (let i = 1; i < slots.length; i++) {
      expect(toMinutes(slots[i]) - toMinutes(slots[i - 1])).toBe(30);
    }
  });
});

describe("getValidDurations", () => {
  it("returns all three durations for clinic start", () => {
    expect(getValidDurations("09:00")).toEqual([30, 45, 60]);
  });

  it("returns only [30] for 17:30 (only 30-min booking fits before 18:00)", () => {
    expect(getValidDurations("17:30")).toEqual([30]);
  });

  it("returns empty array for 17:45 (no duration fits before 18:00)", () => {
    expect(getValidDurations("17:45")).toEqual([]);
  });

  it("returns empty array for 18:00 (clinic end, nothing fits)", () => {
    expect(getValidDurations(CLINIC_END)).toEqual([]);
  });

  it("returns [30, 45, 60] for 17:00 (60-min booking ends exactly at 18:00)", () => {
    expect(getValidDurations("17:00")).toEqual([30, 45, 60]);
  });

  it("returns [30, 45] for 17:15", () => {
    expect(getValidDurations("17:15")).toEqual([30, 45]);
  });
});

describe("checkOverlap", () => {
  it("returns true when intervals fully overlap (identical)", () => {
    expect(checkOverlap("10:00", "11:00", "10:00", "11:00")).toBe(true);
  });

  it("returns true when one interval is contained within the other", () => {
    expect(checkOverlap("10:00", "12:00", "10:30", "11:30")).toBe(true);
  });

  it("returns true when intervals partially overlap at the start", () => {
    expect(checkOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);
  });

  it("returns true when intervals partially overlap at the end", () => {
    expect(checkOverlap("10:30", "11:30", "10:00", "11:00")).toBe(true);
  });

  it("returns false for non-overlapping intervals (a before b)", () => {
    expect(checkOverlap("09:00", "10:00", "11:00", "12:00")).toBe(false);
  });

  it("returns false for non-overlapping intervals (b before a)", () => {
    expect(checkOverlap("11:00", "12:00", "09:00", "10:00")).toBe(false);
  });

  it("returns false for back-to-back intervals (aEnd === bStart)", () => {
    expect(checkOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });

  it("returns false for back-to-back intervals (bEnd === aStart)", () => {
    expect(checkOverlap("10:00", "11:00", "09:00", "10:00")).toBe(false);
  });
});

describe("toDateString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("pads single-digit month with a leading zero", () => {
    expect(toDateString(new Date(2026, 2, 1))).toBe("2026-03-01");
  });

  it("pads single-digit day with a leading zero", () => {
    expect(toDateString(new Date(2026, 11, 9))).toBe("2026-12-09");
  });

  it("handles end-of-year date", () => {
    expect(toDateString(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("today", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current date as YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12)); // 2026-04-12
    expect(today()).toBe("2026-04-12");
  });

  it("reflects the mocked date, not a hardcoded value", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // 2025-06-15
    expect(today()).toBe("2025-06-15");
  });
});

describe("getBookableDates", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns exactly 30 dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12));
    expect(getBookableDates()).toHaveLength(30);
  });

  it("first date is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12));
    expect(getBookableDates()[0]).toBe("2026-04-12");
  });

  it("last date is 29 days from today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12));
    expect(getBookableDates()[29]).toBe("2026-05-11");
  });

  it("dates are consecutive calendar days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12));
    const dates = getBookableDates();
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("rolls over month boundary correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 25)); // 2026-04-25
    const dates = getBookableDates();
    expect(dates[5]).toBe("2026-04-30");
    expect(dates[6]).toBe("2026-05-01");
  });
});
