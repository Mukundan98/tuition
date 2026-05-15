"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { apiFetch } from "@/lib/api";
import type { StudentOnlineExamListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Payload = {
  student: { id: number; name: string; admission_number: string };
  items: StudentOnlineExamListItem[];
};

export function StudentOnlineExamsListClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<Payload>("online-exams/for-me");
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows columns={4} rows={5} lastColumnRight />
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Online exams</h2>
          <p className="text-sm text-muted-foreground">Admission {data.student.admission_number}</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No published exams for your class right now.
                </TableCell>
              </TableRow>
            )}
            {data.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-center tabular-nums">{row.questions_count}</TableCell>
                <TableCell>
                  {row.is_submitted ? (
                    <span className="text-emerald-700">
                      Submitted
                      {row.score != null && row.max_score != null
                        ? ` · ${row.score} / ${row.max_score}`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not submitted</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {row.is_submitted ? (
                    <Link
                      href={`/online-exams/${row.id}/result`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Analysis
                    </Link>
                  ) : (
                    <Link
                      href={`/online-exams/${row.id}/take`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-gradient-to-r from-indigo-600 to-violet-600 text-primary-foreground hover:opacity-95"
                      )}
                    >
                      Take exam
                    </Link>
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
