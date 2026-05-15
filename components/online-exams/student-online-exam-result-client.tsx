"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

type Line = {
  question_id: number;
  prompt: string;
  options: string[];
  chosen_index: number | null;
  correct_index: number;
  is_correct: boolean;
  points: string;
  earned: string;
};

type ResultPayload = {
  exam: { id: number; title: string };
  attempt: {
    score: string | null;
    max_score: string | null;
    percentage: number | null;
    submitted_at: string;
  };
  lines: Line[];
};

export function StudentOnlineExamResultClient({ examId }: { examId: string }) {
  const [data, setData] = useState<ResultPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<ResultPayload>(`online-exams/${examId}/my-result`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "No result yet.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-destructive">{err}</p>
        <Link href="/online-exams" className="text-sm text-muted-foreground hover:underline">
          ← Online exams
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{data.exam.title}</h2>
          <p className="text-sm text-muted-foreground">
            Score {data.attempt.score ?? "—"} / {data.attempt.max_score ?? "—"}
            {data.attempt.percentage != null ? ` (${data.attempt.percentage}%)` : ""}
          </p>
        </div>
        <Link href="/online-exams" className="text-sm text-muted-foreground hover:underline">
          ← Online exams
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Submitted {new Date(data.attempt.submitted_at).toLocaleString()}
      </p>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Your answer</TableHead>
              <TableHead>Correct</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lines.map((line, i) => (
              <TableRow key={line.question_id}>
                <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="max-w-[14rem] text-sm whitespace-pre-wrap">{line.prompt}</TableCell>
                <TableCell className="text-sm">
                  {line.chosen_index != null && line.options[line.chosen_index] != null
                    ? line.options[line.chosen_index]
                    : "—"}
                </TableCell>
                <TableCell>
                  <span className={line.is_correct ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                    {line.is_correct ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.earned} / {line.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
