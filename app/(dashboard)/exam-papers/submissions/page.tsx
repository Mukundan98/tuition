"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { AdminExamPapersClient } from "@/components/exam-papers/admin-exam-papers-client";

export default function ExamPaperSubmissionsPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (user.role?.slug !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status !== "authed" || !user) {
    return <AppPageLoader variant="fullscreen" />;
  }

  if (user.role?.slug !== "admin") {
    return <AppPageLoader variant="fullscreen" />;
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <AdminExamPapersClient />
    </div>
  );
}
