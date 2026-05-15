/** `day_of_week` from API: 0 = Sunday … 6 = Saturday (PHP `w`). */
export const TIMETABLE_DAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const TIMETABLE_DAY_LABELS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function timetableDayShort(d: number): string {
  return TIMETABLE_DAY_LABELS_SHORT[d] ?? `D${d}`;
}

export function timetableDayLong(d: number): string {
  return TIMETABLE_DAY_LABELS_LONG[d] ?? `Day ${d}`;
}

export function timetableDayOrder(): number[] {
  return [0, 1, 2, 3, 4, 5, 6];
}
