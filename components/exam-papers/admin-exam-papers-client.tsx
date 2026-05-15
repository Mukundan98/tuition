"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileStack, Trash2 } from "lucide-react";
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
import type {
  ExamPaperAdminStats,
  ExamPaperRow,
  ListMeta,
} from "@/lib/types";
import { formatBytes, examClassLabel, examSubjectLabel } from "@/lib/utils";

export function AdminExamPapersClient() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [items, setItems] = useState<ExamPaperRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [stats, setStats] = useState<ExamPaperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<ExamPaperRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  const load = useCallback(async () => {
    void listVersion;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "20" });
    if (qDebounced) qs.set("q", qDebounced);
    const r = await apiFetch<{
      items: ExamPaperRow[];
      meta: ListMeta;
      stats: ExamPaperAdminStats | null;
    }>(`exam-papers?${qs}`);
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load exam papers.");
      setItems([]);
      setMeta(null);
      setStats(null);
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setMeta(r.json.data.meta);
    setStats(r.json.data.stats ?? null);
  }, [page, qDebounced, listVersion]);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Exam paper uploads
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Each upload lists the student class, subject, and teacher so you can
          track coverage at a glance. Search includes class, subject, teacher,
          and filenames.
        </p>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Total uploads</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.total_uploads}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Last 7 days</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.uploads_last_7_days}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Teachers</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.unique_teachers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Classes</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.unique_classes}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Subjects</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.unique_subjects}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileStack className="size-4 opacity-80" aria-hidden />
            All submissions
          </CardTitle>
          <Input
            className="sm:max-w-xs"
            placeholder="Search class, subject, teacher, title, file…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search uploads"
          />
        </CardHeader>
        <CardContent className="pt-4 px-0">
          {err ? <p className="px-4 text-sm text-destructive mb-3">{err}</p> : null}
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="w-[88px]">Size</TableHead>
                    <TableHead className="w-[120px]">Uploaded</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeletonRows columns={8} rows={8} lastColumnRight />
                </TableBody>
              </Table>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={FileStack}
                title={qDebounced ? "No matches" : "No uploads yet"}
                description={
                  qDebounced
                    ? "Try different keywords."
                    : "Teachers can upload from My exam papers in the portal."
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead className="w-[88px]">Size</TableHead>
                      <TableHead className="w-[120px]">Uploaded</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap align-top text-muted-foreground">
                          {examClassLabel(row.school_class)}
                        </TableCell>
                        <TableCell className="align-top font-medium">
                          {examSubjectLabel(row.subject)}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="font-medium">
                            {row.teacher?.name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.teacher?.employee_id}
                            {row.teacher?.email
                              ? ` · ${row.teacher.email}`
                              : null}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] align-top font-medium">
                          {row.title ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate align-top text-muted-foreground">
                          {row.original_filename}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatBytes(row.size_bytes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Download"
                            onClick={() => void onDownload(row)}
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            aria-label="Delete"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {meta ? (
                <div className="px-4 pt-4">
                  <PaginationBar meta={meta} onPage={setPage} />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this upload?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file for all users.{" "}
              <span className="block mt-1 text-foreground">
                {examClassLabel(deleteTarget?.school_class)} ·{" "}
                {examSubjectLabel(deleteTarget?.subject)} ·{" "}
                {deleteTarget?.teacher?.name ?? "—"} ·{" "}
                {deleteTarget?.original_filename}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
