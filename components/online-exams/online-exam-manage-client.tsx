"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiJson } from "@/lib/api";
import type {
  OnlineExamAnalyticsPayload,
  OnlineExamAttemptRow,
  OnlineExamDetail,
  OnlineExamQuestionRow,
  SchoolClassRow,
} from "@/lib/types";
import { firstError } from "@/lib/types";

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OnlineExamManageClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<OnlineExamDetail | null>(null);
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");

  const [attempts, setAttempts] = useState<OnlineExamAttemptRow[]>([]);
  const [analytics, setAnalytics] = useState<OnlineExamAnalyticsPayload | null>(null);

  const [qPrompt, setQPrompt] = useState("");
  const [qOpt, setQOpt] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState("0");
  const [qPoints, setQPoints] = useState("1");
  const [qErr, setQErr] = useState<string | null>(null);
  const [qPending, setQPending] = useState(false);

  const loadExam = useCallback(async () => {
    const r = await apiFetch<{ exam: OnlineExamDetail }>(`online-exams/${examId}`);
    if (!r.ok || !r.json?.success || !r.json.data?.exam) {
      setLoadErr(r.json?.message ?? "Not found.");
      setExam(null);
      return;
    }
    setLoadErr(null);
    const e = r.json.data.exam;
    setExam(e);
    setTitle(e.title);
    setClassId(String(e.class_id));
    setDescription(e.description ?? "");
    setIsPublished(e.is_published);
    setAvailableFrom(isoToDatetimeLocal(e.available_from));
    setAvailableUntil(isoToDatetimeLocal(e.available_until));
    setDurationMinutes(String(e.duration_minutes));
  }, [examId]);

  const loadAttempts = useCallback(async () => {
    const r = await apiFetch<{ items: OnlineExamAttemptRow[] }>(`online-exams/${examId}/attempts`);
    if (r.json?.success && r.json.data?.items) setAttempts(r.json.data.items);
  }, [examId]);

  const loadAnalytics = useCallback(async () => {
    const r = await apiFetch<OnlineExamAnalyticsPayload>(`online-exams/${examId}/analytics`);
    if (r.json?.success && r.json.data) {
      setAnalytics(r.json.data);
    }
  }, [examId]);

  useEffect(() => {
    void (async () => {
      const cr = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=200");
      if (cr.json?.success && cr.json.data?.items) setClasses(cr.json.data.items);
    })();
  }, []);

  useEffect(() => {
    void loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (!exam) return;
    void loadAttempts();
    void loadAnalytics();
  }, [exam, loadAttempts, loadAnalytics]);

  async function saveMeta() {
    setSaveErr(null);
    setSaveOk(false);
    setSaving(true);
    const body: Record<string, unknown> = {
      title: title.trim(),
      class_id: Number(classId),
      description: description.trim() || null,
      is_published: isPublished,
      duration_minutes: Number(durationMinutes) || 60,
      available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
      available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
    };
    const r = await apiJson(`online-exams/${examId}`, "PUT", body);
    setSaving(false);
    if (!r.ok || !r.json?.success) {
      setSaveErr(firstError(r.json?.errors) ?? r.json?.message ?? "Save failed.");
      return;
    }
    setSaveOk(true);
    void loadExam();
    void loadAttempts();
    void loadAnalytics();
  }

  async function addQuestion() {
    setQErr(null);
    const opts = qOpt.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) {
      setQErr("Enter at least two non-empty options.");
      return;
    }
    const ci = Number(qCorrect);
    if (!Number.isInteger(ci) || ci < 0 || ci >= opts.length) {
      setQErr("Pick a valid correct option.");
      return;
    }
    setQPending(true);
    const r = await apiJson(`online-exams/${examId}/questions`, "POST", {
      prompt: qPrompt.trim(),
      options: opts,
      correct_index: ci,
      points: Number(qPoints) || 1,
    });
    setQPending(false);
    if (!r.ok || !r.json?.success) {
      setQErr(firstError(r.json?.errors) ?? r.json?.message ?? "Failed.");
      return;
    }
    setQPrompt("");
    setQOpt(["", "", "", ""]);
    setQCorrect("0");
    setQPoints("1");
    void loadExam();
    void loadAnalytics();
  }

  async function removeQuestion(q: OnlineExamQuestionRow) {
    if (!confirm("Remove this question?")) return;
    const r = await apiJson(`online-exam-questions/${q.id}`, "DELETE");
    if (!r.ok || !r.json?.success) return;
    void loadExam();
    void loadAnalytics();
  }

  async function deleteExam() {
    if (!confirm("Delete this entire online exam?")) return;
    const r = await apiJson(`online-exams/${examId}`, "DELETE");
    if (!r.ok || !r.json?.success) return;
    router.push("/online-exams");
    router.refresh();
  }

  if (loadErr) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive">{loadErr}</p>
        <Link href="/online-exams" className="text-sm hover:underline">
          ← List
        </Link>
      </div>
    );
  }

  if (!exam) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Manage online exam</h2>
          <p className="text-sm text-muted-foreground">{exam.title}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="destructive" size="sm" onClick={() => void deleteExam()}>
            Delete exam
          </Button>
          <Link href="/online-exams" className="text-sm text-muted-foreground hover:underline self-center">
            ← List
          </Link>
        </div>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Settings</h3>
        {saveErr && <p className="text-sm text-destructive">{saveErr}</p>}
        {saveOk && <p className="text-sm text-emerald-700">Saved.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.section ? ` (${c.section})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <textarea
              className="min-h-[4rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Available from (optional)</Label>
            <Input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Available until (optional)</Label>
            <Input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published (visible to students in this class)
          </label>
        </div>
        <Button type="button" disabled={saving} onClick={() => void saveMeta()}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Questions (MCQ)</h3>
        {qErr && <p className="text-sm text-destructive">{qErr}</p>}
        <div className="space-y-2">
          <Label>Prompt</Label>
          <textarea
            className="min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={qPrompt}
            onChange={(e) => setQPrompt(e.target.value)}
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <Label>Option {i + 1}</Label>
              <Input
                value={qOpt[i]}
                onChange={(e) => {
                  const next = [...qOpt];
                  next[i] = e.target.value;
                  setQOpt(next);
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label>Correct option</Label>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={qCorrect}
              onChange={(e) => setQCorrect(e.target.value)}
            >
              {[0, 1, 2, 3].map((i) => (
                <option key={i} value={i}>
                  #{i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Points</Label>
            <Input className="w-24" value={qPoints} onChange={(e) => setQPoints(e.target.value)} />
          </div>
        </div>
        <Button type="button" disabled={qPending} onClick={() => void addQuestion()}>
          {qPending ? "Adding…" : "Add question"}
        </Button>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No questions yet.
                  </TableCell>
                </TableRow>
              )}
              {exam.questions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="max-w-md truncate text-sm">{q.prompt}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.points}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      className="text-sm text-destructive hover:underline"
                      onClick={() => void removeQuestion(q)}
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Analysis</h3>
        {analytics && (
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Submissions:</span> {analytics.submitted_count}
            </p>
            <p>
              <span className="text-muted-foreground">Average score:</span>{" "}
              {analytics.average_score != null ? analytics.average_score : "—"} / {analytics.max_score}
            </p>
            <p>
              <span className="text-muted-foreground">Avg % (of max):</span>{" "}
              {analytics.average_percentage != null ? `${analytics.average_percentage}%` : "—"}
            </p>
          </div>
        )}
        {analytics && analytics.per_question.length > 0 && (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead className="text-right">% correct</TableHead>
                  <TableHead className="text-right">Correct / N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.per_question.map((row) => (
                  <TableRow key={row.question_id}>
                    <TableCell className="max-w-md text-sm">{row.prompt_preview}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.correct_rate_pct != null ? `${row.correct_rate_pct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.correct_count} / {row.submitted_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Student marks</h3>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No submissions yet.
                  </TableCell>
                </TableRow>
              )}
              {attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.student?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.student?.admission_number ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.score ?? "—"} / {a.max_score ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.percentage != null ? `${a.percentage}%` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
