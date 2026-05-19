"use client";

import { Loader2 } from "lucide-react";
import { TmsLogoMark } from "@/components/brand/tms-logo";
import { cn } from "@/lib/utils";

type AppPageLoaderProps = {
  variant?: "fullscreen" | "section";
  className?: string;
};

export function AppPageLoader({
  variant = "section",
  className,
}: AppPageLoaderProps) {
  const inner = (
    <div className="flex flex-col items-center gap-6 text-center">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10 dark:shadow-indigo-500/15 dark:ring-indigo-400/15"
        aria-hidden
      >
        <TmsLogoMark size={56} className="rounded-2xl shadow-md" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400"
            aria-hidden
          />
          <span>Loading your workspace</span>
        </div>
        <p className="text-xs text-muted-foreground">Tuvo Management System</p>
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading application"
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50/90 via-background to-violet-50/70 dark:from-gray-950 dark:via-background dark:to-indigo-950/40",
          className
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/10"
        />
        <div className="relative z-10 px-6">{inner}</div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
      className={cn(
        "flex min-h-[50vh] w-full items-center justify-center py-12",
        className
      )}
    >
      {inner}
    </div>
  );
}
