"use client";

import { humanizeFieldName } from "@/lib/api-errors";

export function ApiValidationSummary({
  errors,
}: {
  errors: Record<string, string[]> | null | undefined;
}) {
  if (!errors || Object.keys(errors).length === 0) return null;

  const rows: { key: string; message: string }[] = [];
  for (const [field, msgs] of Object.entries(errors)) {
    for (const m of msgs) {
      if (m) rows.push({ key: field, message: m });
    }
  }
  if (!rows.length) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <p className="font-medium">Please fix the following:</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {rows.map((row, i) => (
          <li key={`${row.key}-${i}`}>
            <span className="font-medium capitalize">{humanizeFieldName(row.key)}:</span>{" "}
            {row.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
