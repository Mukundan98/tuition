import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Human-readable file size (base-1024). */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const rounded = i === 0 ? Math.round(v) : v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return `${rounded} ${units[i]}`;
}

/** Class display for exam paper rows (student cohort). */
export function examClassLabel(
  c: { name: string; section: string | null } | null | undefined
): string {
  if (!c) return "—";
  return [c.name, c.section].filter(Boolean).join(" · ");
}

/** Subject display for exam paper rows. */
export function examSubjectLabel(
  s: { name: string; code: string } | null | undefined
): string {
  if (!s) return "—";
  return `${s.name} (${s.code})`;
}
