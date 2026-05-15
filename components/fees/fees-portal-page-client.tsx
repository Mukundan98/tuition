"use client";

import { useAuth } from "@/components/auth/auth-context";
import { StudentMyFeesClient } from "@/components/fees/student-my-fees-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function FeesPortalPageClient() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (user.role?.slug === "admin") {
      router.replace("/fees/report");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (user?.role?.slug === "admin") {
    return null;
  }

  if (user?.role?.slug !== "student" || !user.student?.id) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <p className="text-lg font-medium">Fees</p>
        <p className="text-sm text-muted-foreground">
          This page is for student accounts. Fees for students you manage are available from the student
          profile.
        </p>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return <StudentMyFeesClient studentId={user.student.id} variant="student" />;
}
