"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CardListPageSkeleton } from "@/components/ui/table-skeleton";
import { apiFetch } from "@/lib/api";

type PerfRow = {
  exam: {
    id: number;
    title: string;
    exam_date: string;
    max_marks: string;
    class: { id: number; name: string; section: string | null } | null;
  };
  average_marks: number;
  average_grade: string;
  average_percentage: number;
  subjects_count: number;
};

export default function StudentExamPerformancePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<{
    id: number;
    name: string;
    admission_number: string;
  } | null>(null);
  const [exams, setExams] = useState<PerfRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<{
      student: { id: number; name: string; admission_number: string };
      exams: PerfRow[];
    }>(`students/${id}/exam-performance`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      return;
    }
    setErr(null);
    setStudent(r.json.data.student);
    setExams(r.json.data.exams);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive">{err}</p>
        <Link href={`/students/${id}`} className="text-sm hover:underline">
          ← Profile
        </Link>
      </div>
    );
  }

  if (!student) {
    return <CardListPageSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h2 className="text-xl font-semibold">Exam performance — {student.name}</h2>
        <p className="text-sm text-muted-foreground">{student.admission_number}</p>
      </div>
      <Link href={`/students/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← Profile
      </Link>

      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exam marks recorded yet.</p>
      ) : (
        <ul className="space-y-4">
          {exams.map((row) => (
            <li key={row.exam.id} className="rounded-lg border p-4">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{row.exam.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.exam.exam_date}
                    {row.exam.class?.name ? ` · ${row.exam.class.name}` : ""}{" "}
                    · avg {row.average_marks} / {row.exam.max_marks} ({row.average_grade}) ·{" "}
                    {row.subjects_count} subjects
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all"
                    style={{
                      width: `${Math.min(100, row.average_percentage)}%`,
                      minWidth: row.average_percentage > 0 ? "3%" : "0%",
                    }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">{row.average_percentage}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
