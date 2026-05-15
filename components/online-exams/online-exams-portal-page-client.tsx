"use client";

import { useAuth } from "@/components/auth/auth-context";
import { OnlineExamsAdminListClient } from "@/components/online-exams/online-exams-admin-list-client";
import { StudentOnlineExamsListClient } from "@/components/online-exams/student-online-exams-list-client";
import Link from "next/link";

export function OnlineExamsPortalPageClient() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">
        Loading…
      </div>
    );
  }

  const slug = user?.role?.slug;
  if (slug === "admin") {
    return <OnlineExamsAdminListClient />;
  }
  if (slug === "student" && user?.student?.id) {
    return <StudentOnlineExamsListClient />;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <p className="text-lg font-medium">Online exams</p>
      <p className="text-sm text-muted-foreground">This area is for students and administrators.</p>
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
    </div>
  );
}
