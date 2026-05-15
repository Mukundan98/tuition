"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { PaginationBar } from "@/components/crud/pagination-bar";
import { ExamForm } from "@/components/exams/exam-form";
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { ExamRow, ListMeta, SchoolClassRow } from "@/lib/types";

type ExamEdit = {
  id: number;
  class_id: number;
  title: string;
  exam_date: string;
  max_marks: string;
  notes?: string | null;
};

export function ExamsListClient() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExamRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editExam, setEditExam] = useState<ExamEdit | null>(null);
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExamRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) setClasses(r.json.data.items);
    })();
  }, []);

  const load = useCallback(async () => {
    void listVersion;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "15" });
    if (q) qs.set("q", q);
    if (classId) qs.set("class_id", classId);
    const r = await apiFetch<{ items: ExamRow[]; meta: ListMeta }>(`exams?${qs}`);
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      setItems([]);
      setMeta(null);
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setMeta(r.json.data.meta);
  }, [page, q, classId, listVersion]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editId == null) {
      setEditExam(null);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{ exam: ExamEdit }>(`exams/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.exam) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditExam(null);
        setEditLoading(false);
        return;
      }
      setEditExam(r.json.data.exam);
      setEditLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [editId]);

  function bumpList() {
    setListVersion((v) => v + 1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteErr(null);
    const r = await apiJson(`exams/${deleteTarget.id}`, "DELETE");
    setDeletePending(false);
    if (!r.ok || !r.json?.success) {
      setDeleteErr(
        firstError(r.json?.errors as Record<string, string[]> | undefined) ??
          r.json?.message ??
          "Delete failed"
      );
      return;
    }
    setDeleteTarget(null);
    bumpList();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Exams</h2>
          <p className="text-sm text-muted-foreground">Per class, with marks and report cards.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New exam
        </Button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          const fd = new FormData(e.currentTarget);
          setQ(String(fd.get("qq") ?? ""));
          setClassId(String(fd.get("class_filter") ?? ""));
        }}
      >
        <Input name="qq" placeholder="Search title…" className="max-w-xs" defaultValue={q} />
        <select
          name="class_filter"
          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
          defaultValue={classId}
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {loading && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Max marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows columns={5} lastColumnRight />
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No exams yet"
          description="Create an exam for a class to record marks and issue report cards."
        >
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New exam
          </Button>
        </EmptyState>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Max marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell>
                      {row.school_class?.name ?? "—"}
                      {row.school_class?.section ? ` (${row.school_class.section})` : ""}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.exam_date}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.max_marks}</TableCell>
                    <TableCell className="text-right space-x-3 whitespace-nowrap">
                      <Link href={`/exams/${row.id}`} className="text-sm text-indigo-600 hover:underline">
                        Open
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground hover:underline"
                        onClick={() => setEditId(row.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm text-destructive hover:underline"
                        onClick={() => {
                          setDeleteErr(null);
                          setDeleteTarget(row);
                        }}
                      >
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {meta && meta.last_page > 1 && !loading && (
            <PaginationBar meta={meta} onPage={setPage} />
          )}
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New exam</DialogTitle>
            <DialogDescription>Create an exam window for a class.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ExamForm
              mode="create"
              variant="dialog"
              onCancel={() => setCreateOpen(false)}
              onSaved={() => {
                setCreateOpen(false);
                bumpList();
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={editId != null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit exam</DialogTitle>
            <DialogDescription>Update exam schedule and marks.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editExam && editId != null && (
              <ExamForm
                key={editId}
                mode="edit"
                examId={editId}
                defaultValues={{
                  class_id: String(editExam.class_id),
                  title: editExam.title,
                  exam_date: editExam.exam_date,
                  max_marks: editExam.max_marks,
                  notes: editExam.notes ?? "",
                }}
                variant="dialog"
                onCancel={() => setEditId(null)}
                onSaved={() => {
                  setEditId(null);
                  bumpList();
                }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteErr(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove “${deleteTarget.title}” and related marks metadata. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErr && <p className="px-6 pb-2 text-sm text-destructive">{deleteErr}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
              disabled={deletePending}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
