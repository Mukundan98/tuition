"use client";

import { TmsLogoFull } from "@/components/brand/tms-logo";
import { cn } from "@/lib/utils";
import { DashboardNavLinks } from "@/components/dashboard/dashboard-nav-links";
import { Sparkles } from "lucide-react";

type Props = {
  mode?: "desktop" | "drawer";
  onNavigate?: () => void;
};

export function AppSidebar({ mode = "desktop", onNavigate }: Props) {
  return (
    <aside
      className={cn(
        "group/sidebar relative flex w-[17rem] flex-col print:hidden",
        "border-sidebar-border bg-sidebar text-sidebar-foreground",
        "shadow-[inset_-1px_0_0_0_var(--sidebar-border)]",
        mode === "desktop" && "hidden border-r lg:flex",
        mode === "drawer" && "h-full min-h-0 w-full border-0 shadow-none"
      )}
    >
      {/* Ambient depth — light mesh in light mode, soft glow in dark */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-100",
          "bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,oklch(0.55_0.2_264/0.09),transparent_55%)]",
          "dark:bg-[radial-gradient(ellipse_100%_60%_at_0%_0%,oklch(0.55_0.2_264/0.12),transparent_50%)]"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80",
          "bg-gradient-to-b from-indigo-500/[0.04] via-transparent to-violet-500/[0.07]",
          "dark:from-indigo-400/[0.06] dark:via-transparent dark:to-violet-500/[0.04]"
        )}
      />

      {/* Header */}
      <div className="relative z-[1] shrink-0 border-b border-sidebar-border/80 px-3 py-3 backdrop-blur-[2px]">
        <TmsLogoFull
          variant="sidebar"
          markSize={38}
          href="/dashboard"
          className="min-w-0 transition-opacity hover:opacity-95"
        />
        <p className="mt-2 pl-[3rem] text-[11px] leading-snug text-muted-foreground">
          Tuition center workspace
        </p>
      </div>

      {/* Nav */}
      <nav className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-2 [scrollbar-width:thin]">
        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
          Menu
        </p>
        <DashboardNavLinks onNavigate={onNavigate} />
      </nav>

      {/* Footer */}
      <div className="relative z-[1] shrink-0 p-2 pt-1.5">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/40 px-2.5 py-2",
            "dark:bg-sidebar-accent/30"
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-600 dark:from-indigo-400/20 dark:to-violet-400/10 dark:text-indigo-300">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Release
            </p>
            <p className="truncate text-xs font-medium text-sidebar-foreground/90">
              Phase 6 · Dashboards &amp; reports
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
