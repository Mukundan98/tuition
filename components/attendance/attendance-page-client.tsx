"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ClipboardList, ScanBarcode } from "lucide-react";
import { BarcodeAttendanceTab } from "@/components/attendance/barcode-attendance-tab";
import { ManualAttendanceTab } from "@/components/attendance/manual-attendance-tab";
import { cn } from "@/lib/utils";

type TabKey = "manual" | "barcode";

const modes = [
  {
    key: "manual" as const,
    title: "Manual entry",
    description: "Pick the class, fill the day sheet, save in one go.",
    Icon: ClipboardList,
  },
  {
    key: "barcode" as const,
    title: "Barcode scan",
    description: "Scan admission codes as learners arrive at the door.",
    Icon: ScanBarcode,
  },
];

export function AttendancePageClient() {
  const [tab, setTab] = useState<TabKey>("manual");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-teal-50/90 via-card to-sky-50/50 p-6 shadow-sm ring-1 ring-black/[0.04] dark:from-teal-950/35 dark:via-card dark:to-sky-950/25 dark:ring-white/[0.06] md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-400/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-400/10"
        />

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Attendance
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Manual day sheet or fast barcode scans for daily roll‑call.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/attendance/barcode-labels"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Print barcode labels
                <ArrowUpRight className="size-4 opacity-70" aria-hidden />
              </Link>
              <Link
                href="/attendance/report"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Reports &amp; export
                <ArrowUpRight className="size-4 opacity-70" aria-hidden />
              </Link>
            </div>
          </div>

          <div role="tablist" aria-label="Attendance mode" className="grid gap-3 sm:grid-cols-2">
            {modes.map(({ key, title, description, Icon }) => {
              const selected = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={selected}
                  aria-controls="panel-attendance"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(key)}
                  className={cn(
                    "group relative flex w-full gap-4 rounded-2xl border px-5 py-4 text-left outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-teal-600/35 bg-background/95 shadow-md shadow-teal-900/[0.07] ring-2 ring-teal-600/20 dark:border-teal-400/25 dark:bg-card dark:shadow-black/20 dark:ring-teal-400/15"
                      : "border-border/80 bg-background/40 hover:border-teal-600/25 hover:bg-background/70 dark:hover:border-teal-400/20"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      selected
                        ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-teal-950"
                        : "bg-muted text-muted-foreground group-hover:bg-teal-600/10 group-hover:text-teal-800 dark:group-hover:text-teal-200"
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-sm font-semibold tracking-tight">{title}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
                  </span>
                  {selected && (
                    <span
                      className="absolute right-3 top-3 size-2 rounded-full bg-teal-600 dark:bg-teal-400"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id="panel-attendance"
        role="tabpanel"
        aria-labelledby={tab === "manual" ? "tab-manual" : "tab-barcode"}
        className="mt-6 min-h-[12rem]"
      >
        {tab === "manual" && <ManualAttendanceTab />}
        {tab === "barcode" && <BarcodeAttendanceTab />}
      </div>
    </div>
  );
}
