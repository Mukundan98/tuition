"use client";

import { useAuth } from "@/components/auth/auth-context";
import { StudentExamResultsClient } from "@/components/exams/student-exam-results-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ExamResultsPortalPageClient() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (user.role?.slug === "admin") {
      router.replace("/exams");
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
        <p className="text-lg font-medium">Exam results</p>
        <p className="text-sm text-muted-foreground">
          This page is for student accounts. Exam performance for students you manage is available from the
          student profile.
        </p>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return <StudentExamResultsClient studentId={user.student.id} variant="student" />;
}
