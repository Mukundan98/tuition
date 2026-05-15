"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Button } from "@/components/ui/button";
import { ProfileDetailSkeleton } from "@/components/ui/table-skeleton";
import { apiFetch, apiJson } from "@/lib/api";

type Detail = {
  id: number;
  employee_id: string;
  qualification: string | null;
  specialization: string | null;
  joining_date: string | null;
  salary: string | null;
  photo_url: string | null;
  user: { id: number; name: string; email: string; phone: string | null } | null;
  subjects: Array<{
    id: number;
    name: string;
    code: string;
    class_id: number;
    school_class?: { id: number; name: string; section: string | null };
  }>;
};

export default function TeacherDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<{ teacher: Detail }>(`teachers/${id}`);
    if (!r.ok || !r.json?.success || !r.json.data?.teacher) {
      setErr(r.json?.message ?? "Not found");
      setT(null);
      return;
    }
    setErr(null);
    setT(r.json.data.teacher);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    setPending(true);
    await apiJson(`teachers/${id}`, "DELETE");
    setPending(false);
    setOpen(false);
    router.replace("/teachers");
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !t) return;
    const fd = new FormData();
    fd.append("photo", file);
    const r = await apiFetch<{ teacher: Detail }>(`teachers/${t.id}/photo`, {
      method: "POST",
      body: fd,
    });
    if (r.json?.success && r.json.data?.teacher) setT(r.json.data.teacher);
    e.target.value = "";
  }

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link href="/teachers" className="text-sm text-muted-foreground hover:underline">
          ← Teachers
        </Link>
      </div>
    );
  }
  if (!t) return <ProfileDetailSkeleton className="max-w-3xl" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <PersonAvatar
              name={t.user?.name ?? "Teacher"}
              photoUrl={t.photo_url}
              kind="teacher"
              size="lg"
            />
            <label className="cursor-pointer text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-left">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t.user?.name}</h2>
            <p className="text-muted-foreground">{t.user?.email}</p>
            <p className="text-sm">{t.employee_id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/teachers"
            className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted"
          >
            Edit in list
          </Link>
          <Button variant="destructive" type="button" onClick={() => setOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the teacher profile and linked user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 rounded-xl border p-6 sm:grid-cols-2">
        <div className="text-sm">
          <span className="text-muted-foreground">Qualification</span>
          <p>{t.qualification ?? "—"}</p>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Specialization</span>
          <p>{t.specialization ?? "—"}</p>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Joining</span>
          <p>{t.joining_date ?? "—"}</p>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Salary</span>
          <p>{t.salary ?? "—"}</p>
        </div>
        <div className="text-sm sm:col-span-2">
          <span className="text-muted-foreground">Phone</span>
          <p>{t.user?.phone ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="mb-4 font-semibold">Subject assignments</h3>
        {t.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Assign subjects under Subjects tab.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {t.subjects.map((s) => (
              <li key={s.id}>
                <span className="font-medium">{s.name}</span> ({s.code})
                {s.school_class
                  ? ` · ${s.school_class.name}${s.school_class.section ? ` (${s.school_class.section})` : ""}`
                  : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/teachers" className="text-sm text-muted-foreground hover:underline">
          ← Teachers
        </Link>
      </div>
    </div>
  );
}
