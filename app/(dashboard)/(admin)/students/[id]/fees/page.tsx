"use client";

import { StudentMyFeesClient } from "@/components/fees/student-my-fees-client";
import { useParams } from "next/navigation";

export default function StudentFeesPage() {
  const { id } = useParams<{ id: string }>();
  const sid = Number(id);
  if (!Number.isFinite(sid) || sid < 1) {
    return <p className="p-8 text-destructive">Invalid student.</p>;
  }
  return <StudentMyFeesClient studentId={sid} variant="admin" />;
}
