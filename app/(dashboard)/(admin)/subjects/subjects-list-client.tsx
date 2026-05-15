"use client";

import { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SubjectForm } from "@/components/subjects/subject-form";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { ListMeta, SubjectRow } from "@/lib/types";

type ListPayload = { items: SubjectRow[]; meta: ListMeta };

export function SubjectsListClient({
  initialClassFilter,
}: {
  initialClassFilter?: string | null;
}) {
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState(initialClassFilter ?? "");
  const [items, setItems] = useState<SubjectRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    setClassFilter(initialClassFilter ?? "");
  }, [initialClassFilter]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDefaults, setEditDefaults] = useState<{
    class_ids: string[];
    teacher_id: string;
    name: string;
    code: string;
  }>();
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  /** DB `class_id` for the subject row being edited — must stay in `class_ids` on save. */
  const [editRowClassId, setEditRowClassId] = useState<number | null>(null);

  const [viewRow, setViewRow] = useState<SubjectRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const createLockedClassId = useMemo(() => {
    const n = Number(classFilter);
    return classFilter !== "" && Number.isInteger(n) && n > 0 ? n : null;
  }, [classFilter]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const qs = new URLSearchParams({
        page: String(page),
        per_page: "20",
        aggregate: "1",
      });
      if (q) qs.set("q", q);
      if (classFilter) qs.set("class_id", classFilter);
      const r = await apiFetch<ListPayload>(`subjects?${qs}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data) {
        setErr(r.json?.message ?? "Failed.");
        setItems([]);
        setMeta(null);
      } else {
        setErr(null);
        setItems(r.json.data.items);
        setMeta(r.json.data.meta);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [page, q, classFilter, listVersion]);

  useEffect(() => {
    if (editId == null) {
      setEditDefaults(undefined);
      setEditRowClassId(null);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{
        subject: {
          class_id: number;
          class_ids: number[];
          teacher_id: number | null;
          name: string;
          code: string;
        };
      }>(`subjects/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.subject) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditDefaults(undefined);
        setEditRowClassId(null);
        setEditLoading(false);
        return;
      }
      const s = r.json.data.subject;
      setEditRowClassId(s.class_id);
      const classIds =
        Array.isArray(s.class_ids) && s.class_ids.length > 0
          ? s.class_ids
          : [s.class_id];
      setEditDefaults({
        class_ids: classIds.map(String),
        teacher_id: s.teacher_id != null ? String(s.teacher_id) : "",
        name: s.name,
        code: s.code,
      });
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
    const ids =
      deleteTarget.subject_ids && deleteTarget.subject_ids.length > 0
        ? deleteTarget.subject_ids
        : [deleteTarget.id];
    for (const id of ids) {
      const r = await apiJson(`subjects/${id}`, "DELETE");
      if (!r.ok || !r.json?.success) {
        setDeletePending(false);
        setDeleteErr(
          firstError(r.json?.errors as Record<string, string[]> | undefined) ??
            r.json?.message ??
            "Delete failed"
        );
        return;
      }
    }
    setDeletePending(false);
    setDeleteTarget(null);
    bumpList();
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="text-sm text-muted-foreground">
            One row per subject (same code, name, teacher). Class column shows grades like 6, 7, 8; “common” is omitted.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setCreateOpen(true);
          }}
        >
          New subject
        </Button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setPage(1);
          setQ(String(fd.get("qq") ?? ""));
          setClassFilter(String(fd.get("class_id_filter") ?? ""));
        }}
      >
        <Input name="qq" placeholder="Search name/code…" defaultValue={q} className="max-w-xs" />
        <Input
          name="class_id_filter"
          placeholder="Filter by class id"
          defaultValue={classFilter}
          className="w-36"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={5} lastColumnRight />}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No subjects.</TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((s) => (
                <TableRow key={(s.subject_ids ?? [s.id]).join("-")}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.code}</TableCell>
                  <TableCell>
                    {s.classes_label != null && s.classes_label !== ""
                      ? s.classes_label
                      : (s.school_class?.name ?? "—")}
                  </TableCell>
                  <TableCell>{s.teacher?.name ?? "—"}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <button
                      type="button"
                      className="text-sm text-indigo-600 hover:underline"
                      onClick={() => setViewRow(s)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={() => setEditId(s.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm text-destructive hover:underline"
                      onClick={() => {
                        setDeleteErr(null);
                        setDeleteTarget(s);
                      }}
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {meta && meta.last_page > 1 && (
          <PaginationBar meta={meta} onPage={setPage} />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New subject</DialogTitle>
            <DialogDescription>
              Assign one or more classes and optionally a teacher. Same code cannot repeat within a class.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <SubjectForm
              mode="create"
              variant="dialog"
              lockedClassIds={createLockedClassId != null ? [createLockedClassId] : undefined}
              defaultValues={{
                class_ids: createLockedClassId != null ? [String(createLockedClassId)] : [],
                teacher_id: "",
                name: "",
                code: "",
              }}
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
            <DialogTitle>Edit subject</DialogTitle>
            <DialogDescription>Update subject assignment.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editDefaults && editId != null && (
              <SubjectForm
                key={editId}
                mode="edit"
                subjectId={editId}
                lockedClassIds={editRowClassId != null ? [editRowClassId] : undefined}
                defaultValues={editDefaults}
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

      <Dialog open={viewRow != null} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subject</DialogTitle>
            <DialogDescription>Read-only summary.</DialogDescription>
          </DialogHeader>
          <DialogBody className="pb-2">
            {viewRow && (
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{viewRow.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Code</dt>
                  <dd>{viewRow.code}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Class</dt>
                  <dd>
                    {viewRow.classes_label != null && viewRow.classes_label !== ""
                      ? viewRow.classes_label
                      : (viewRow.school_class?.name ?? "—")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Teacher</dt>
                  <dd>{viewRow.teacher?.name ?? "—"}</dd>
                </div>
              </dl>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setViewRow(null)}>
              Close
            </Button>
          </DialogFooter>
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
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? (() => {
                    const n = deleteTarget.subject_ids?.length ?? 0;
                    const scope =
                      n > 1
                        ? `from ${n} classes (same subject). This cannot be undone.`
                        : "from the class. This cannot be undone.";
                    return `Remove “${deleteTarget.name}” (${deleteTarget.code}) ${scope}`;
                  })()
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
