"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Clock,
  GraduationCap,
  ListChecks,
  Plus,
  Settings2,
  Tag,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ProfileDetailSkeleton } from "@/components/ui/table-skeleton";
import { apiFetch, apiJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  OnlineExamAnalyticsPayload,
  OnlineExamAttemptRow,
  OnlineExamDetail,
  OnlineExamQuestionRow,
  SchoolClassRow,
} from "@/lib/types";
import { firstError } from "@/lib/types";

const selectClassName =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  accent = "indigo",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  accent?: "indigo" | "violet" | "teal";
}) {
  const accentBg = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  }[accent];

  return (
    <Card className="overflow-hidden shadow-sm ring-1 ring-border/60">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-border/50 bg-muted/20 pb-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accentBg
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
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
  const [type, setType] = useState("mcq");
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
  const [qCorrectWord, setQCorrectWord] = useState("");
  const [qPoints, setQPoints] = useState("1");
  const [qErr, setQErr] = useState<string | null>(null);
  const [qPending, setQPending] = useState(false);

  const [uploadingQuestions, setUploadingQuestions] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Multi-Select State
  const [selectedQIds, setSelectedQIds] = useState<Set<number>>(new Set());
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editOpt, setEditOpt] = useState(["", "", "", ""]);
  const [editCorrect, setEditCorrect] = useState("0");
  const [editCorrectWord, setEditCorrectWord] = useState("");
  const [editPoints, setEditPoints] = useState("1");
  const [editPending, setEditPending] = useState(false);

  type DeleteAction = { type: 'exam' } | { type: 'question', q: OnlineExamQuestionRow } | { type: 'selected' } | null;
  const [deleteAction, setDeleteAction] = useState<DeleteAction>(null);

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
    setType(e.type);
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
    if (r.json?.success && r.json.data) setAnalytics(r.json.data);
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
      type: type,
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
    let opts: string[] = [];
    let ci = 0;

    if (exam?.type === "mcq") {
      opts = qOpt.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        setQErr("Enter at least two non-empty options.");
        return;
      }
      ci = Number(qCorrect);
      if (!Number.isInteger(ci) || ci < 0 || ci >= opts.length) {
        setQErr("Pick a valid correct option.");
        return;
      }
    } else if (exam?.type === "single_word") {
      const correctWord = qCorrectWord.trim();
      if (!correctWord) {
        setQErr("Enter the correct single-word answer.");
        return;
      }
      opts = [correctWord];
      ci = 0;
    } else {
      opts = [""];
      ci = 0;
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
    setQCorrectWord("");
    setQPoints("1");
    void loadExam();
    void loadAnalytics();
  }

  async function uploadQuestionsFile(file: File) {
    if (!file) return;
    setUploadingQuestions(true);
    setUploadErr(null);
    setQErr(null);

    const fd = new FormData();
    fd.append("document", file);

    try {
      const res = await apiFetch<{ added_count: number }>(`online-exams/${examId}/upload-questions`, {
        method: "POST",
        body: fd,
      });
      
      if (!res.ok || !res.json?.success) {
        const errorMsg = res.json?.message ?? "Upload failed";
        setUploadErr(errorMsg);
        setQErr(errorMsg);
      } else {
        setQErr("AI Parsed: " + (res.json?.message ?? "Questions uploaded successfully!"));
        void loadExam();
        void loadAnalytics();
      }
    } catch (e: any) {
      setUploadErr(e.message ?? "Upload error");
      setQErr(e.message ?? "Upload error");
    } finally {
      setUploadingQuestions(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removeQuestion(q: OnlineExamQuestionRow) {
    const r = await apiJson(`online-exam-questions/${q.id}`, "DELETE");
    if (!r.ok || !r.json?.success) return;
    void loadExam();
    void loadAnalytics();
  }

  function toggleSelectAll(checked: boolean) {
    if (checked && exam) {
      setSelectedQIds(new Set(exam.questions.map(q => q.id)));
    } else {
      setSelectedQIds(new Set());
    }
  }

  function toggleSelectQ(id: number, checked: boolean) {
    const next = new Set(selectedQIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedQIds(next);
  }

  async function deleteSelectedQuestions() {
    if (selectedQIds.size === 0) return;
    
    for (const id of Array.from(selectedQIds)) {
      await apiJson(`online-exam-questions/${id}`, "DELETE");
    }
    setSelectedQIds(new Set());
    void loadExam();
    void loadAnalytics();
  }

  function startEditing(q: OnlineExamQuestionRow) {
    setEditingQId(q.id);
    setEditPrompt(q.prompt);
    if (exam?.type === "mcq") {
      setEditOpt([...(q.options || ["", "", "", ""])]);
      setEditCorrect(String(q.correct_index ?? 0));
    } else if (exam?.type === "single_word") {
      setEditCorrectWord(q.options[0] || "");
    }
    setEditPoints(String(q.points || 1));
  }

  function cancelEditing() {
    setEditingQId(null);
  }

  async function saveEditing() {
    if (!editingQId) return;
    
    let opts: string[] = [];
    let ci = 0;

    if (exam?.type === "mcq") {
      opts = editOpt.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        alert("Enter at least two non-empty options.");
        return;
      }
      ci = Number(editCorrect);
    } else if (exam?.type === "single_word") {
      const cw = editCorrectWord.trim();
      if (!cw) {
        alert("Enter the correct single-word answer.");
        return;
      }
      opts = [cw];
    } else {
      opts = [""];
    }

    setEditPending(true);
    const r = await apiJson(`online-exam-questions/${editingQId}`, "PUT", {
      prompt: editPrompt.trim(),
      options: opts,
      correct_index: ci,
      points: Number(editPoints) || 1,
    });
    setEditPending(false);

    if (!r.ok || !r.json?.success) {
      alert(firstError(r.json?.errors) ?? r.json?.message ?? "Failed to update.");
      return;
    }
    
    setEditingQId(null);
    void loadExam();
    void loadAnalytics();
  }

  async function deleteExam() {
    const r = await apiJson(`online-exams/${examId}`, "DELETE");
    if (!r.ok || !r.json?.success) return;
    router.push("/online-exams");
    router.refresh();
  }

  function confirmDelete() {
    if (!deleteAction) return;
    if (deleteAction.type === 'exam') {
      void deleteExam();
    } else if (deleteAction.type === 'question') {
      void removeQuestion(deleteAction.q);
    } else if (deleteAction.type === 'selected') {
      void deleteSelectedQuestions();
    }
    setDeleteAction(null);
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <p className="text-destructive">{loadErr}</p>
        <Link
          href="/online-exams"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to online exams
        </Link>
      </div>
    );
  }

  if (!exam) {
    return <ProfileDetailSkeleton className="mx-auto max-w-5xl" />;
  }

  const questionCount = exam.questions.length;
  const maxScore = exam.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const selectedClass = classes.find((c) => String(c.id) === classId);
  const selectedClassName = selectedClass?.name ?? exam.school_class?.name ?? "Class";
  const selectedClassSection = selectedClass?.section ?? exam.school_class?.section;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/95 via-card to-violet-50/80 p-6 shadow-sm ring-1 ring-black/[0.04] dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-card dark:to-violet-950/30 dark:ring-white/[0.06] md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/online-exams"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Online exams
            </Link>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                {title || "Untitled exam"}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <GraduationCap className="size-4 shrink-0" aria-hidden />
                {selectedClassName}
                {selectedClassSection ? ` · ${selectedClassSection}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  isPublished
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                )}
              >
                {isPublished ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <CircleDashed className="size-3.5" aria-hidden />
                )}
                {isPublished ? "Published" : "Draft"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <Tag className="size-3.5" aria-hidden />
                <span className="capitalize">{exam.type === "mcq" ? "MCQ" : exam.type === "single_word" ? "Single word" : "Long word"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <ListChecks className="size-3.5" aria-hidden />
                {questionCount} question{questionCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <Clock className="size-3.5" aria-hidden />
                {durationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                {maxScore} pts max
              </span>
            </div>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteAction({ type: 'exam' })}>
            <Trash2 className="size-4 mr-2" aria-hidden />
            Delete exam
          </Button>
        </div>
      </div>
      <SectionCard
        icon={Settings2}
        title="Settings"
        description="Title, schedule, duration, and visibility for students."
      >
        {saveErr && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveErr}
          </p>
        )}
        {saveOk && (
          <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            Settings saved successfully.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="exam-title">Title</Label>
            <Input id="exam-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-class">Class</Label>
            <select
              id="exam-class"
              className={selectClassName}
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
          <div className="space-y-2">
            <Label htmlFor="exam-type">Exam Type</Label>
            <select
              id="exam-type"
              className={selectClassName}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="single_word">Single word</option>
              <option value="long_word">Long word</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="exam-desc">Description</Label>
            <Textarea
              id="exam-desc"
              className="min-h-[5rem]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or notes for students (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-from">Available from (optional)</Label>
            <Input
              id="exam-from"
              type="datetime-local"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-until">Available until (optional)</Label>
            <Input
              id="exam-until"
              type="datetime-local"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-duration">Duration (minutes)</Label>
            <Input
              id="exam-duration"
              type="number"
              min={5}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
        </div>
        <label
          className={cn(
            "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
            isPublished
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border/80 bg-muted/30 hover:bg-muted/50"
          )}
        >
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">Published</span>
            <span className="block text-xs text-muted-foreground">
              Visible to students in the selected class when the window is open.
            </span>
          </span>
        </label>
        <div className="mt-6">
          <Button type="button" disabled={saving} onClick={() => void saveMeta()}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={ListChecks}
        title={exam.type === "mcq" ? "Questions (MCQ)" : exam.type === "single_word" ? "Questions (Single Word)" : "Questions (Long Word / Essay)"}
        description={exam.type === "mcq" ? "Add multiple-choice items for this exam." : exam.type === "single_word" ? "Add single-word answer items for this exam." : "Add open-ended essay questions for this exam."}
        accent="violet"
      >
        {qErr && (
          <p
            className={cn(
              "mb-3 text-sm font-medium rounded-lg border px-3 py-2",
              qErr.startsWith("AI Parsed:")
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            )}
          >
            {qErr}
          </p>
        )}
        <div className="space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New question</p>
          <div className="space-y-2">
            {/* <Label htmlFor="q-prompt">Prompt</Label> */}
            <Textarea
              id="q-prompt"
              className="min-h-[5rem] bg-background"
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
            />
          </div>
          {exam.type === "mcq" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTION_LETTERS.map((letter, i) => (
                <div key={letter} className="flex gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {letter}
                  </span>
                  <Input
                    value={qOpt[i]}
                    onChange={(e) => {
                      const next = [...qOpt];
                      next[i] = e.target.value;
                      setQOpt(next);
                    }}
                    placeholder={`Option ${letter}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}
          {exam.type === "single_word" && (
            <div className="space-y-2">
              <Label htmlFor="q-correct-word">Correct Answer</Label>
              <Input
                id="q-correct-word"
                className="max-w-md bg-background"
                value={qCorrectWord}
                onChange={(e) => setQCorrectWord(e.target.value)}
                placeholder="Enter correct single word"
              />
            </div>
          )}
          <div className="flex flex-wrap items-end gap-4">
            {exam.type === "mcq" && (
              <div className="space-y-1">
                <Label>Correct option</Label>
                <select
                  className={cn(selectClassName, "w-auto min-w-[7rem]")}
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                >
                  {OPTION_LETTERS.map((letter, i) => (
                    <option key={letter} value={i}>
                      {letter}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Points</Label>
              <Input
                className="w-24"
                value={qPoints}
                onChange={(e) => setQPoints(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" disabled={qPending || uploadingQuestions} onClick={() => void addQuestion()}>
                <Plus className="size-4" aria-hidden />
                {qPending ? "Adding…" : "Add question"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                disabled={qPending || uploadingQuestions} 
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-4 mr-2" aria-hidden />
                {uploadingQuestions ? "Analyzing Document..." : "Upload Document (PDF/DOCX/TXT)"}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.pdf,.doc,.docx,.rtf" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadQuestionsFile(file);
                }} 
              />
            </div>
          </div>
        </div>
        <Separator className="my-6" />
        {selectedQIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <span className="text-sm font-medium text-destructive">
              {selectedQIds.size} question{selectedQIds.size > 1 ? "s" : ""} selected
            </span>
            <Button variant="destructive" size="sm" onClick={() => setDeleteAction({ type: 'selected' })}>
              <Trash2 className="size-4 mr-1.5" aria-hidden />
              Delete Selected
            </Button>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input cursor-pointer"
                    checked={exam.questions.length > 0 && selectedQIds.size === exam.questions.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No questions yet. Add your first MCQ above.
                  </TableCell>
                </TableRow>
              )}
              {exam.questions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell className="text-center align-top pt-4">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input cursor-pointer"
                      checked={selectedQIds.has(q.id)}
                      onChange={(e) => toggleSelectQ(q.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium tabular-nums text-muted-foreground align-top pt-4">{i + 1}</TableCell>
                  
                  {editingQId === q.id ? (
                    <TableCell colSpan={3} className="p-4 bg-muted/10">
                      <div className="space-y-4">
                        <Textarea
                          className="min-h-[4rem] bg-background text-sm"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                        />
                        
                        {exam.type === "mcq" && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {OPTION_LETTERS.map((letter, idx) => (
                              <div key={letter} className="flex items-center gap-2">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                  {letter}
                                </span>
                                <Input
                                  className="h-8 text-sm bg-background"
                                  value={editOpt[idx] ?? ""}
                                  onChange={(e) => {
                                    const next = [...editOpt];
                                    next[idx] = e.target.value;
                                    setEditOpt(next);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {exam.type === "single_word" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Correct Answer</Label>
                            <Input
                              className="h-8 text-sm max-w-sm bg-background"
                              value={editCorrectWord}
                              onChange={(e) => setEditCorrectWord(e.target.value)}
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {exam.type === "mcq" && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Correct:</Label>
                              <select
                                className={cn(selectClassName, "h-8 py-0 w-auto text-xs bg-background")}
                                value={editCorrect}
                                onChange={(e) => setEditCorrect(e.target.value)}
                              >
                                {OPTION_LETTERS.map((letter, idx) => (
                                  <option key={letter} value={idx}>{letter}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Points:</Label>
                            <Input
                              className="h-8 w-20 text-sm bg-background"
                              value={editPoints}
                              onChange={(e) => setEditPoints(e.target.value)}
                            />
                          </div>

                          <div className="flex-1" />
                          
                          <Button type="button" variant="ghost" size="sm" onClick={cancelEditing} disabled={editPending}>
                            Cancel
                          </Button>
                          <Button type="button" size="sm" onClick={() => void saveEditing()} disabled={editPending}>
                            {editPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="max-w-md text-sm align-top pt-4">
                        <div className="font-semibold whitespace-pre-wrap">{q.prompt}</div>
                        {exam.type === "mcq" && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={cn(
                                  "flex items-center gap-1.5 p-1.5 rounded border",
                                  optIdx === q.correct_index
                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-semibold"
                                    : "border-transparent"
                                )}
                              >
                                <span className="font-bold">{OPTION_LETTERS[optIdx]}:</span> {opt}
                              {optIdx === q.correct_index && (
                                <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="size-3" aria-hidden /> Correct
                                </span>
                              )}
                              </div>
                            ))}
                          </div>
                        )}
                        {exam.type === "single_word" && (
                          <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                            <span className="text-muted-foreground font-normal">Correct answer:</span>
                            <span className="bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/30">{q.options[0]}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top pt-4">{q.points}</TableCell>
                      <TableCell className="text-right align-top pt-4 space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(q)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteAction({ type: 'question', q })}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard icon={BarChart3} title="Analysis" accent="teal">
        {analytics ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill
              label="Submissions"
              value={String(analytics.submitted_count)}
              icon={Users}
            />
            <StatPill
              label="Average score"
              value={
                analytics.average_score != null
                  ? `${analytics.average_score} / ${analytics.max_score}`
                  : "—"
              }
              icon={BarChart3}
            />
            <StatPill
              label="Average %"
              value={
                analytics.average_percentage != null
                  ? `${analytics.average_percentage}%`
                  : "—"
              }
              icon={CheckCircle2}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No analytics yet.</p>
        )}
        {analytics && analytics.per_question.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="overflow-hidden rounded-lg border">
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
          </>
        )}
      </SectionCard>

      {/* <SectionCard icon={Users} title="Student marks" description="Submitted attempts and scores.">
        <div className="overflow-hidden rounded-lg border">
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
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No submissions yet.
                  </TableCell>
                </TableRow>
              )}
              {attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.student?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.student?.admission_number ?? "—"}
                  </TableCell>
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
      </SectionCard> */}

      <AlertDialog open={deleteAction !== null} onOpenChange={(isOpen) => !isOpen && setDeleteAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction?.type === 'exam' && "This will permanently delete this entire exam and all associated questions and student submissions. This action cannot be undone."}
              {deleteAction?.type === 'selected' && `This will permanently delete ${selectedQIds.size} selected questions. This action cannot be undone.`}
              {deleteAction?.type === 'question' && "This will permanently delete this question. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
