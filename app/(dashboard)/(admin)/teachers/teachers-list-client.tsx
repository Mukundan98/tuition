"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { TeacherForm, type TeacherFormValues } from "@/components/teachers/teacher-form";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { ListMeta, TeacherRow } from "@/lib/types";

type ListPayload = { items: TeacherRow[]; meta: ListMeta };

export function TeachersListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  const q = sp.get("q") ?? "";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TeacherRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDefaults, setEditDefaults] = useState<Partial<TeacherFormValues>>();
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const qs = new URLSearchParams({ page: String(page), per_page: "15" });
      if (q) qs.set("q", q);
      const r = await apiFetch<ListPayload>(`teachers?${qs}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data) {
        setErr(r.json?.message ?? "Could not load teachers.");
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
  }, [page, q, listVersion]);

  useEffect(() => {
    if (editId == null) {
      setEditDefaults(undefined);
      setEditPhotoUrl(null);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{
        teacher: {
          id: number;
          employee_id: string;
          qualification: string | null;
          specialization: string | null;
          joining_date: string | null;
          salary: string | number | null;
          user?: { name: string; email: string; phone: string | null; username: string | null } | null;
          photo_url: string | null;
        };
      }>(`teachers/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.teacher) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditDefaults(undefined);
        setEditPhotoUrl(null);
        setEditLoading(false);
        return;
      }
      const t = r.json.data.teacher;
      const u = t.user;
      setEditPhotoUrl(t.photo_url ?? null);
      setEditDefaults({
        name: u?.name ?? "",
        email: u?.email ?? "",
        username: u?.username ?? "",
        employee_id: t.employee_id,
        qualification: t.qualification ?? "",
        specialization: t.specialization ?? "",
        joining_date: t.joining_date ?? "",
        salary: t.salary != null ? String(t.salary) : "",
        phone: u?.phone ?? "",
        password: "",
        password_confirmation: "",
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
    const r = await apiJson(`teachers/${deleteTarget.id}`, "DELETE");
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
          <h2 className="text-xl font-semibold tracking-tight">Teachers</h2>
          <p className="text-sm text-muted-foreground">Manage teacher logins and class assignments.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add teacher
        </Button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const qq = String(fd.get("qq") ?? "");
          const n = new URLSearchParams();
          if (qq) n.set("q", qq);
          n.set("page", "1");
          router.push(`/teachers?${n}`);
        }}
      >
        <Input name="qq" defaultValue={q} placeholder="Search…" className="max-w-xs" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {err && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableSkeletonRows columns={4} leadCell="avatar" lastColumnRight />
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No teachers.</TableCell>
              </TableRow>
            )}
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <PersonAvatar
                      name={t.user?.name ?? "Teacher"}
                      photoUrl={t.photo_url}
                      kind="teacher"
                      size="sm"
                    />
                    <div>
                      <div>{t.user?.name ?? "—"}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {t.user?.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{t.employee_id}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.subjects?.length ?? 0} assignment(s)
                </TableCell>
                <TableCell className="text-right space-x-3">
                  <Link
                    href={`/teachers/${t.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:underline"
                    onClick={() => setEditId(t.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm text-destructive hover:underline"
                    onClick={() => {
                      setDeleteErr(null);
                      setDeleteTarget(t);
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
          <PaginationBar
            meta={meta}
            onPage={(p) => {
              const n = new URLSearchParams(sp.toString());
              n.set("page", String(p));
              router.push(`/teachers?${n}`);
            }}
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add teacher</DialogTitle>
            <DialogDescription>Create a staff account and link their profile.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <TeacherForm
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit teacher</DialogTitle>
            <DialogDescription>Update profile and optional password.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editDefaults && editId != null && (
              <TeacherForm
                key={editId}
                mode="edit"
                teacherId={editId}
                defaultValues={editDefaults}
                existingPhotoUrl={editPhotoUrl}
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
            <AlertDialogTitle>Delete teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.user?.name ?? deleteTarget.employee_id} from the system. This cannot be undone.`
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
