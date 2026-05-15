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
import { StudentForm, type StudentFormSchema } from "@/components/students/student-form";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { ListMeta, StudentRow } from "@/lib/types";

type ListPayload = { items: StudentRow[]; meta: ListMeta };

export function StudentsListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  const q = sp.get("q") ?? "";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editPortalUserId, setEditPortalUserId] = useState<number | null>(null);
  const [editDefaults, setEditDefaults] = useState<Partial<StudentFormSchema>>();
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      const qs = new URLSearchParams({ page: String(page), per_page: "15" });
      if (q) qs.set("q", q);
      const r = await apiFetch<ListPayload>(`students?${qs}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data) {
        setErr(r.json?.message ?? "Could not load students.");
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
      setEditPortalUserId(null);
      setEditPhotoUrl(null);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{
        student: {
          id: number;
          user_id: number | null;
          name: string;
          email: string | null;
          admission_number: string;
          user?: { id: number; name: string; email: string; username: string | null } | null;
          class_id?: number | null;
          school_class?: { id: number } | null;
          date_of_birth: string | null;
          gender: string | null;
          address: string | null;
          blood_group: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          parent_email: string | null;
          parent_occupation: string | null;
          photo_url: string | null;
        };
      }>(`students/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.student) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditDefaults(undefined);
        setEditPhotoUrl(null);
        setEditLoading(false);
        return;
      }
      const s = r.json.data.student;
      setEditPhotoUrl(s.photo_url ?? null);
      setEditPortalUserId(s.user_id ?? null);
      setEditDefaults({
        name: s.name,
        email: s.email ?? "",
        username: s.user?.username ?? "",
        admission_number: s.admission_number,
        class_id:
          s.class_id != null
            ? String(s.class_id)
            : s.school_class?.id != null
              ? String(s.school_class.id)
              : "",
        date_of_birth: s.date_of_birth ?? "",
        gender: s.gender ?? "",
        address: s.address ?? "",
        blood_group: s.blood_group ?? "",
        parent_name: s.parent_name ?? "",
        parent_phone: s.parent_phone ?? "",
        parent_email: s.parent_email ?? "",
        parent_occupation: s.parent_occupation ?? "",
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

  function goPage(p: number) {
    const n = new URLSearchParams(sp.toString());
    n.set("page", String(p));
    router.push(`/students?${n}`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteErr(null);
    const r = await apiJson(`students/${deleteTarget.id}`, "DELETE");
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
          <h2 className="text-xl font-semibold tracking-tight">Students</h2>
          <p className="text-sm text-muted-foreground">
            Search by name, admission, or parent details.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add student
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
          router.push(`/students?${n}`);
        }}
      >
        <Input
          name="qq"
          defaultValue={q}
          placeholder="Search…"
          className="max-w-xs"
        />
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
              <TableHead>Admission</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableSkeletonRows columns={5} leadCell="avatar" lastColumnRight />
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <PersonAvatar name={s.name} photoUrl={s.photo_url} kind="student" size="sm" />
                    <div>
                      <div>{s.name}</div>
                      {s.email && (
                        <div className="text-xs font-normal text-muted-foreground">
                          {s.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{s.admission_number}</TableCell>
                <TableCell>
                  {s.school_class
                    ? `${s.school_class.name}${s.school_class.section ? ` · ${s.school_class.section}` : ""}`
                    : "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {s.parent_name ?? "—"}
                  {s.parent_phone ? ` · ${s.parent_phone}` : ""}
                </TableCell>
                <TableCell className="text-right space-x-3">
                  <Link
                    href={`/students/${s.id}`}
                    className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    View
                  </Link>
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
        {meta && !loading && meta.last_page > 1 && (
          <PaginationBar meta={meta} onPage={goPage} />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>Enrol a student and guardian details.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <StudentForm
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
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>Update enrolment and contact information.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editDefaults && editId != null && (
              <StudentForm
                key={editId}
                mode="edit"
                studentId={editId}
                portalUserId={editPortalUserId}
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
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.name} (${deleteTarget.admission_number}). This cannot be undone.`
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
