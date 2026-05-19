"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FilePlus2,
  Files,
  FileText,
  FileUp,
  History,
  Info,
  LayoutDashboard,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PaginationBar } from "@/components/crud/pagination-bar";
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
import { EmptyState } from "@/components/ui/empty-state";
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
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiDownload, apiFetch, triggerBrowserDownload } from "@/lib/api";
import type { ExamPaperRow, ListMeta, TeachingSubjectOption } from "@/lib/types";
import { firstError } from "@/lib/types";
import { cn, examClassLabel, examSubjectLabel, formatBytes } from "@/lib/utils";

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
);

export function TeacherExamPapersClient() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExamPaperRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubjectOption[]>(
    []
  );
  const [subjectId, setSubjectId] = useState("");

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ExamPaperRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    void listVersion;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "15" });
    const r = await apiFetch<{ items: ExamPaperRow[]; meta: ListMeta }>(
      `exam-papers?${qs}`
    );
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load exam papers.");
      setItems([]);
      setMeta(null);
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setMeta(r.json.data.meta);
  }, [page, listVersion]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: TeachingSubjectOption[] }>(
        "my-teaching-subjects"
      );
      if (r.json?.success && r.json.data?.items) {
        setTeachingSubjects(r.json.data.items);
      }
    })();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadErr(null);
    setUploadMsg(null);
    if (!subjectId) {
      setUploadErr("Select the class and subject this paper is for.");
      return;
    }
    if (!file) {
      setUploadErr("Choose a PDF or Word file.");
      return;
    }
    setUploadBusy(true);
    const fd = new FormData();
    fd.append("subject_id", subjectId);
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());
    if (notes.trim()) fd.append("notes", notes.trim());
    const res = await fetch("/api/laravel/exam-papers", {
      method: "POST",
      body: fd,
      credentials: "include",
      cache: "no-store",
    });
    type UploadBody = {
      success?: boolean;
      message?: string;
      errors?: Record<string, string[]>;
    };
    let body: UploadBody | null = null;
    try {
      body = (await res.json()) as UploadBody;
    } catch {
      body = null;
    }
    setUploadBusy(false);
    if (!res.ok || !body?.success) {
      setUploadErr(
        firstError(body?.errors) ?? body?.message ?? "Upload failed."
      );
      return;
    }
    setUploadMsg("Uploaded successfully.");
    setFile(null);
    setTitle("");
    setNotes("");
    setListVersion((v) => v + 1);
    setPage(1);
  }

  async function onDownload(row: ExamPaperRow) {
    const r = await apiDownload(`exam-papers/${row.id}/file`);
    if (!r.ok) {
      setErr("Download failed.");
      return;
    }
    triggerBrowserDownload(r.blob, r.filename ?? row.original_filename);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const r = await apiFetch(`exam-papers/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeletePending(false);
    setDeleteTarget(null);
    if (!r.ok || !r.json?.success) {
      setErr(r.json?.message ?? "Could not delete.");
      return;
    }
    setListVersion((v) => v + 1);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <FileUp className="size-4 text-indigo-500" />
              Teacher Portal
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Paper</h1>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
          <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <Files className="size-10 text-white" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold">Manage Your Submissions</h2>
              <p className="text-indigo-100 max-w-xl">
                Securely upload and manage exam papers for your assigned classes. Admins will review these documents before distribution.
              </p>
            </div>
            <div className="ml-auto hidden xl:block">
              <Sparkles className="size-12 text-indigo-300/40 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Uploads", value: meta?.total ?? 0, icon: History, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Assigned Subjects", value: teachingSubjects.length, icon: FileText, color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: "Max File Size", value: "20 MB", icon: Info, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Pending Review", value: items.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((item) => (
          <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/85 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {item.label}
              </CardDescription>
              <div className={cn("rounded-lg p-2 translate-colors", item.bg)}>
                <item.icon className={cn("size-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums tracking-tight">
                {item.value || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-5 items-start">
        <Card className="rounded-[1.5rem] border-border/50 bg-card/90 shadow-lg backdrop-blur-sm overflow-hidden lg:col-span-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FilePlus2 className="size-5 text-indigo-500" />
              New Submission
            </CardTitle>
            <CardDescription>Upload a PDF or Word paper for review.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onUpload} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="exam-paper-subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class & Subject</Label>
                <select
                  id="exam-paper-subject"
                  className={cn(selectClassName, "h-10 border-muted-foreground/20")}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                >
                  <option value="">Select class and subject…</option>
                  {teachingSubjects.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {examClassLabel(s.school_class)} — {examSubjectLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exam-paper-file" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document File</Label>
                  <span className="text-[10px] font-bold text-indigo-500/60 uppercase">Max 20MB</span>
                </div>
                <Input
                  id="exam-paper-file"
                  type="file"
                  className="h-10 cursor-pointer pt-1.5 focus-visible:ring-indigo-500/20 border-muted-foreground/20"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(ev) => {
                    const f = ev.target.files?.[0] ?? null;
                    setFile(f);
                  }}
                />
                <p className="text-[10px] text-muted-foreground italic">Accepted: PDF, DOC, DOCX</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-paper-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title (Optional)</Label>
                <Input
                  id="exam-paper-title"
                  className="h-10 focus-visible:ring-indigo-500/20 border-muted-foreground/20"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grade 8 - Mid Term 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-paper-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</Label>
                <Textarea
                  id="exam-paper-notes"
                  className="resize-none focus-visible:ring-indigo-500/20 border-muted-foreground/20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Instructions, answer key, coverage details..."
                />
              </div>

              {(uploadErr || uploadMsg) && (
                <div className={cn(
                  "p-3 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300",
                  uploadErr ? "bg-destructive/5 border-destructive/20 text-destructive" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                )}>
                  {uploadErr ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
                  <p className="text-xs font-medium">{uploadErr || uploadMsg}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploadBusy}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg active:scale-95"
              >
                {uploadBusy ? "Uploading Archive..." : "Submit Exam Paper"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <History className="size-5 text-indigo-500" />
              Submission History
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 rounded-2xl animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 bg-muted/20 p-12 text-center">
              <EmptyState
                icon={FileUp}
                title="No papers uploaded"
                description="Your submission history is empty. Start by uploading your first paper."
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((row) => (
                <Card
                  key={row.id}
                  className="group relative overflow-hidden rounded-[1.25rem] border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-1 p-5 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                            {examClassLabel(row.school_class)}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            {examSubjectLabel(row.subject)}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg leading-tight truncate">
                          {row.title || row.original_filename}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <FileText className="size-3.5" />
                            {formatBytes(row.size_bytes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {row.created_at ? new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "---"}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-border/40 bg-muted/10">
                        <Button
                          variant="ghost"
                          className="flex-1 h-14 sm:h-12 w-full sm:w-12 rounded-none hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                          onClick={() => void onDownload(row)}
                          title="Download Paper"
                        >
                          <Download className="size-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 h-14 sm:h-12 w-full sm:w-12 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors border-l sm:border-l-0 sm:border-t border-border/40"
                          onClick={() => setDeleteTarget(row)}
                          title="Permanently Delete"
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {meta && meta.last_page > 1 && (
                <div className="pt-4 flex justify-end">
                  <PaginationBar meta={meta} onPage={setPage} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-3xl border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Destroy this record?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-balance">
              The archive for <span className="font-bold text-foreground italic">{deleteTarget?.original_filename}</span> will be permanently deleted from the paper repository. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deletePending} className="rounded-xl font-semibold">Keep Document</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold shadow-lg shadow-destructive/20 active:scale-95 transition-all"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePending ? "Purging..." : "Confirm Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
