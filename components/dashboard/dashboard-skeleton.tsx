import type { ComponentPropsWithoutRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Shimmer({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted/80 via-muted-foreground/10 to-muted/80 bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  );
}

function SidebarSkeleton({ mode }: { mode?: "desktop" | "drawer" }) {
  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-border bg-sidebar",
        mode === "desktop" && "hidden border-r lg:flex",
        mode === "drawer" && "h-full w-full border-0"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <Shimmer className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Shimmer className="h-3.5 w-16 rounded-sm" />
          <Shimmer className="h-2.5 w-28 max-w-full rounded-sm" />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-full rounded-md" />
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Shimmer className="h-2.5 w-3/4 max-w-[10rem] rounded-sm" />
      </div>
    </aside>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg lg:hidden" />
        <div className="min-w-0 flex-1 space-y-2">
          <Shimmer className="h-4 w-32 max-w-[40%] rounded-md" />
          <Shimmer className="h-3 w-44 max-w-[55%] rounded-md" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Shimmer className="hidden h-9 w-9 shrink-0 rounded-lg sm:block" />
        <Shimmer className="h-9 w-9 shrink-0 rounded-lg" />
        <Shimmer className="hidden h-9 min-w-[7rem] rounded-md md:block" />
        <Shimmer className="h-9 w-9 shrink-0 rounded-full" />
      </div>
    </header>
  );
}

function MainContentSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Shimmer className="h-8 w-48 rounded-md sm:h-9" />
        <Shimmer className="h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm"
          >
            <Shimmer className="h-4 w-24 rounded-md" />
            <Shimmer className="h-16 w-full rounded-lg" />
            <Shimmer className="h-3 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-6">
        <Shimmer className="mb-4 h-5 w-40 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full chrome while session is resolving (matches real dashboard layout). */
export function FullDashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <SidebarSkeleton mode="desktop" />
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderSkeleton />
        <main className="flex-1 overflow-y-auto">
          <MainContentSkeleton />
        </main>
      </div>
    </div>
  );
}

/** Shown under the persistent layout during route transitions (main column only). */
export function DashboardMainSkeleton() {
  return <MainContentSkeleton />;
}
