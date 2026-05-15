"use client";

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        This screen hit an unexpected error. You can try again or return to the
        dashboard from the sidebar.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Try again
      </button>
    </div>
  );
}
