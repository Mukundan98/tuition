"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { apiDownload, apiFetch, triggerBrowserDownload } from "@/lib/api";
import type { ExamResultsRow, ExamRow } from "@/lib/types";

export function ExamResultsClient() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamRow | null>(null);
  const [rows, setRows] = useState<ExamResultsRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<{ exam: ExamRow; rows: ExamResultsRow[] }>(`exams/${id}/results`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      return;
    }
    setErr(null);
    setExam(r.json.data.exam);
    setRows(r.json.data.rows);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadPdf(studentId: number) {
    if (!exam) return;
    const r = await apiDownload(`exams/${exam.id}/report-card/${studentId}`);
    if (!r.ok) return;
    const name =
      r.filename?.replace(/"/g, "").replace(/^UTF-8''/, "") ??
      `report-${exam.id}-${studentId}.pdf`;
    triggerBrowserDownload(r.blob, name || `report.pdf`);
  }

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link href={`/exams/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Exam
        </Link>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-[min(100%,24rem)]" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Avg marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows columns={6} leadCell="double" lastColumnRight />
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href={`/exams/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Exam
        </Link>
        <h2 className="mt-2 text-xl font-semibold">Results — {exam.title}</h2>
        <p className="text-sm text-muted-foreground">{exam.exam_date}</p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Avg marks</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.student.id}>
                <TableCell className="font-medium">
                  {row.student.name}
                  <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                    {row.student.admission_number}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.average_marks ?? "—"}</TableCell>
                <TableCell>{row.average_grade ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{row.average_percentage ?? "—"}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground text-xs">
                  {row.lines?.map((l) => `${l.subject_code}:${l.marks_obtained}`).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.lines && row.lines.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void downloadPdf(row.student.id)}
                    >
                      PDF
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
