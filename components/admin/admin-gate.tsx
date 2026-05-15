"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (user?.role?.slug !== "admin") {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <p className="text-lg font-medium">Administrator access required</p>
        <p className="text-sm text-muted-foreground">
          Phase 2 management screens are restricted to admins. Sign in as
          admin@tms.local or ask your administrator for access.
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return children;
}
