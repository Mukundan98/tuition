"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { TeacherExamPapersClient } from "@/components/exam-papers/teacher-exam-papers-client";

export default function ExamPapersPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (user.role?.slug === "admin") {
      router.replace("/exam-papers/submissions");
      return;
    }
    if (user.role?.slug !== "teacher") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status !== "authed" || !user) {
    return <AppPageLoader variant="fullscreen" />;
  }

  if (user.role?.slug === "admin" || user.role?.slug !== "teacher") {
    return <AppPageLoader variant="fullscreen" />;
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <TeacherExamPapersClient />
    </div>
  );
}
