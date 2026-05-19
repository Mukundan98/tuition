"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ClassForm, type ClassFormSchema } from "@/components/classes/class-form";
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
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { ListMeta, SchoolClassRow } from "@/lib/types";

type ListPayload = { items: SchoolClassRow[]; meta: ListMeta };

export function ClassesListClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SchoolClassRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [listVersion, setListVersion] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDefaults, setEditDefaults] = useState<Partial<ClassFormSchema>>();
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SchoolClassRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    void listVersion;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "20" });
    if (q) qs.set("q", q);
    const r = await apiFetch<ListPayload>(`classes?${qs}`);
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
  }, [page, q, listVersion]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (editId == null) {
      setEditDefaults(undefined);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{
        school_class: {
          id: number;
          name: string;
          max_students: number | null;
          homeroom_teacher_id: number | null;
        };
      }>(`classes/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.school_class) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditDefaults(undefined);
        setEditLoading(false);
        return;
      }
      const c = r.json.data.school_class;
      setEditDefaults({
        name: c.name,
        max_students: c.max_students != null ? String(c.max_students) : "",
        homeroom_teacher_id: c.homeroom_teacher_id
          ? String(c.homeroom_teacher_id)
          : "",
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
    const r = await apiJson(`classes/${deleteTarget.id}`, "DELETE");
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
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="text-sm text-muted-foreground">
            Manage class details, capacity, and assigned teachers.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New class
        </Button>
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const qq = String(fd.get("qq") ?? "");
          setPage(1);
          setQ(qq);
        }}
      >
        <Input name="qq" placeholder="Search…" className="max-w-xs" defaultValue={q} />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Max Students</TableHead>
              <TableHead>Homeroom teacher</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={3} lastColumnRight />}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>No classes.</TableCell>
              </TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-medium">{c.max_students}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.homeroom_teacher
                    ? c.homeroom_teacher.name ??
                    (c.homeroom_teacher.employee_id
                      ? `#${c.homeroom_teacher.employee_id}`
                      : "—")
                    : "All"}
                </TableCell>
                <TableCell className="text-right space-x-3">
                  <Link
                    href={`/classes/${c.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:underline"
                    onClick={() => setEditId(c.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm text-destructive hover:underline"
                    onClick={() => {
                      setDeleteErr(null);
                      setDeleteTarget(c);
                    }}
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {meta && !loading && meta.last_page > 1 && (
          <PaginationBar meta={meta} onPage={setPage} />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New class</DialogTitle>
            <DialogDescription>Add a class and optional homeroom teacher.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ClassForm
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

      <Dialog
        open={editId != null}
        onOpenChange={(o) => {
          if (!o) setEditId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit class</DialogTitle>
            <DialogDescription>Update class details.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editDefaults && editId != null && (
              <ClassForm
                key={editId}
                mode="edit"
                classId={editId}
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
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErr && (
            <p className="px-6 pb-2 text-sm text-destructive">{deleteErr}</p>
          )}
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
