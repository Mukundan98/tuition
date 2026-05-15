"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkSheetTableSkeleton } from "@/components/ui/table-skeleton";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { apiFetch, apiJson } from "@/lib/api";
import { parseApiErrors } from "@/lib/api-errors";
import type { ExamRow, MarkSheetCell } from "@/lib/types";

type Subj = { id: number; name: string; code: string };
type Stu = { id: number; name: string; admission_number: string };

export function ExamMarksClient() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamRow | null>(null);
  const [subjects, setSubjects] = useState<Subj[]>([]);
  const [students, setStudents] = useState<Stu[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null
  );
  const [saveFieldErrors, setSaveFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<{
      exam: ExamRow;
      subjects: Subj[];
      students: Stu[];
      cells: Record<string, MarkSheetCell>;
    }>(`exams/${id}/mark-sheet`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load sheet");
      return;
    }
    setErr(null);
    const d = r.json.data;
    setExam(d.exam);
    setSubjects(d.subjects);
    setStudents(d.students);
    const next: Record<string, string> = {};
    for (const [k, cell] of Object.entries(d.cells)) {
      next[k] = cell.marks_obtained;
    }
    setDraft(next);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const keys = useMemo(
    () => students.flatMap((s) => subjects.map((sub) => `${s.id}:${sub.id}`)),
    [students, subjects]
  );

  function fillAll(val: string) {
    const o: Record<string, string> = { ...draft };
    for (const k of keys) o[k] = val;
    setDraft(o);
  }

  async function save() {
    if (!exam) return;
    setBanner(null);
    setSaveFieldErrors(null);
    const items = keys.map((key) => {
      const [sid, subId] = key.split(":").map(Number);
      const raw = draft[key]?.trim() ?? "";
      const n = raw === "" ? 0 : Number(raw);
      return {
        student_id: sid,
        subject_id: subId,
        marks_obtained: Number.isFinite(n) ? n : 0,
      };
    });
    setSaving(true);
    const r = await apiJson(`exams/${exam.id}/results/bulk`, "PUT", { items });
    setSaving(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        setSaveFieldErrors(parsed);
        return;
      }
      setBanner({
        type: "err",
        msg: (r.json?.message as string | undefined) ?? "Save failed",
      });
      return;
    }
    setSaveFieldErrors(null);
    setBanner({ type: "ok", msg: "Saved." });
    void load();
  }

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link href="/exams" className="text-sm text-muted-foreground hover:underline">
          ← Exams
        </Link>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-[min(100%,20rem)]" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <Skeleton className="h-3 w-full max-w-md" />
        <MarkSheetTableSkeleton subjectCols={6} studentRows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/exams/${id}`} className="text-sm text-muted-foreground hover:underline">
            ← Exam
          </Link>
          <h2 className="text-xl font-semibold">Marks — {exam.title}</h2>
          <p className="text-sm text-muted-foreground">
            Max per subject {exam.max_marks} · adjust all cells then save.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fillAll(String(exam.max_marks))}>
            All max
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fillAll("0")}>
            Clear
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save marks"}
          </Button>
        </div>
      </div>

      {saveFieldErrors && <ApiValidationSummary errors={saveFieldErrors} />}

      {banner && (
        <p
          className={
            banner.type === "ok" ? "text-sm text-emerald-700" : "text-sm text-destructive"
          }
        >
          {banner.msg}
        </p>
      )}
      <p className="text-xs text-muted-foreground lg:hidden">
        Scroll sideways on small screens to see every subject column.
      </p>

      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">Student</th>
              {subjects.map((s) => (
                <th key={s.id} className="border-l px-2 py-2 text-center font-medium whitespace-nowrap min-w-[72px]">
                  <span title={s.name}>{s.code}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id} className="border-b">
                <td className="sticky left-0 z-10 bg-background px-3 py-1 font-medium whitespace-nowrap">
                  {st.name}
                  <span className="ml-1 text-xs text-muted-foreground tabular-nums">{st.admission_number}</span>
                </td>
                {subjects.map((sub) => {
                  const key = `${st.id}:${sub.id}`;
                  return (
                    <td key={key} className="border-l p-1">
                      <Input
                        className="h-8 w-[68px] text-center tabular-nums px-1"
                        inputMode="decimal"
                        value={draft[key] ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
