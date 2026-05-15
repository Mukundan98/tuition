"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { TimetableStudentClient } from "@/components/timetable/timetable-student-client";
import { TimetableTeacherClient } from "@/components/timetable/timetable-teacher-client";

export default function TimetablePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const slug = user?.role?.slug;

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (slug === "admin") {
      router.replace("/timetable/board");
    }
  }, [status, user, slug, router]);

  useEffect(() => {
    if (status !== "authed" || !user) return;
    if (slug && slug !== "student" && slug !== "teacher" && slug !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, user, slug, router]);

  if (status !== "authed" || !user) {
    return <AppPageLoader variant="fullscreen" />;
  }

  if (slug === "admin") {
    return <AppPageLoader variant="fullscreen" />;
  }

  if (slug === "student") {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <TimetableStudentClient />
      </div>
    );
  }

  if (slug === "teacher") {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <TimetableTeacherClient />
      </div>
    );
  }

  return <AppPageLoader variant="fullscreen" />;
}
