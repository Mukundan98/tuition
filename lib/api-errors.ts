import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Normalize `errors` from Laravel ValidationException or `ApiResponse::error(..., $errors)`. */
export function parseApiErrors(
  json: Record<string, unknown> | null | undefined
): Record<string, string[]> | undefined {
  if (!json || typeof json !== "object") return undefined;
  const raw = json.errors;
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, spec] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(spec)) {
      const msgs = spec.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (msgs.length) out[k] = msgs;
    } else if (typeof spec === "string" && spec.length > 0) {
      out[k] = [spec];
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function humanizeFieldName(field: string): string {
  return field.replace(/\./g, " · ").replace(/_/g, " ");
}

/** Map each API error key to a react-hook-form path (Laravel uses the same dotted names). */
export function applyServerErrorsToForm<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: Record<string, string[]> | undefined
): void {
  if (!errors) return;
  for (const [key, msgs] of Object.entries(errors)) {
    const text = msgs.filter(Boolean).join(" ");
    if (!text) continue;
    setError(key as Path<T>, { type: "server", message: text });
  }
}
