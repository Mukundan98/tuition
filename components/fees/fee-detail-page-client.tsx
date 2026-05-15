"use client";

import { useAuth } from "@/components/auth/auth-context";
import { FeeDetailClient } from "@/components/fees/fee-detail-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function FeeDetailPageClient() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    const slug = user.role?.slug;
    if (slug !== "admin" && slug !== "student") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">
        Loading…
      </div>
    );
  }

  const slug = user?.role?.slug;
  if (slug !== "admin" && slug !== "student") {
    return null;
  }

  return <FeeDetailClient variant={slug === "admin" ? "admin" : "student"} />;
}
