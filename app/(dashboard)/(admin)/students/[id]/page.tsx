"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { BarcodeSvg } from "@/components/attendance/barcode-svg";
import type { BarcodeStickerEncoding } from "@/lib/attendance-barcode";
import { attendanceBarcodePayload } from "@/lib/attendance-barcode";

type StudentDetail = {
  id: number;
  name: string;
  email: string | null;
  admission_number: string;
  class_id: number | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  blood_group: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  parent_occupation: string | null;
  photo_url: string | null;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
};

export default function StudentProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [barcodeEncoding, setBarcodeEncoding] = useState<BarcodeStickerEncoding>("admission");

  const barcodePayload = useMemo(() => {
    if (!student) return "";
    return attendanceBarcodePayload(
      {
        payload_admission: student.admission_number,
        payload_sid: `SID:${student.id}`,
      },
      barcodeEncoding
    );
  }, [student, barcodeEncoding]);

  const load = useCallback(async () => {
    const r = await apiFetch<{ student: StudentDetail }>(`students/${id}`);
    if (!r.ok || !r.json?.success || !r.json.data?.student) {
      setErr(r.json?.message ?? "Not found");
      setStudent(null);
      return;
    }
    setErr(null);
    setStudent(r.json.data.student);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    setPending(true);
    await apiJson(`students/${id}`, "DELETE");
    setPending(false);
    setDelOpen(false);
    router.replace("/students");
    router.refresh();
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    const fd = new FormData();
    fd.append("photo", file);
    const r = await apiFetch<{ student: StudentDetail }>(
      `students/${student.id}/photo`,
      { method: "POST", body: fd }
    );
    if (r.json?.success && r.json.data?.student) {
      setStudent(r.json.data.student);
    }
    e.target.value = "";
  }

  if (err) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive">{err}</p>
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← Students
        </Link>
      </div>
    );
  }

  if (!student) {
    return <ProfileDetailSkeleton className="max-w-2xl" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <PersonAvatar
              name={student.name}
              photoUrl={student.photo_url}
              kind="student"
              size="lg"
            />
            <label className="cursor-pointer text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-left">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{student.name}</h2>
            <p className="text-muted-foreground">{student.email ?? "No email"}</p>
            <p className="text-sm">{student.admission_number}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/students/${student.id}/fees`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted"
          >
            Fees
          </Link>
          <Link
            href={`/students/${student.id}/exam-performance`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted"
          >
            Exam performance
          </Link>
          <Link
            href={`/students/${student.id}/attendance`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted"
          >
            Attendance
          </Link>
          <Link
            href="/students"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted"
          >
            Edit in list
          </Link>
          <Button variant="destructive" type="button" onClick={() => setDelOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove {student.name} from the roster. This cannot be undone.
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

      <div className="space-y-4 rounded-xl border bg-card p-6 print:hidden">
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Class</dt>
            <dd>
              {student.school_class
                ? `${student.school_class.name}${student.school_class.section ? ` (${student.school_class.section})` : ""}`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Date of birth</dt>
            <dd>{student.date_of_birth ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Gender</dt>
            <dd>{student.gender ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Blood group</dt>
            <dd>{student.blood_group ?? "—"}</dd>
          </div>
        </dl>
        {student.address && (
          <div>
            <h4 className="mb-1 text-sm font-medium">Address</h4>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {student.address}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h3 className="font-medium">Attendance barcode</h3>
        <p className="hidden font-medium print:block">{student.name}</p>
        <p className="text-sm text-muted-foreground">
          Code 128 for daily barcode attendance. Prefer{" "}
          <span className="font-medium text-foreground">admission number</span> on printed cards so labels stay valid if records are recreated. Scanning still requires selecting this student&apos;s class on the attendance screen.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="barcode-encoding"
              className="accent-teal-600"
              checked={barcodeEncoding === "admission"}
              onChange={() => setBarcodeEncoding("admission")}
            />
            Admission number
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="barcode-encoding"
              className="accent-teal-600"
              checked={barcodeEncoding === "sid"}
              onChange={() => setBarcodeEncoding("sid")}
            />
            SID:{student.id}
          </label>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4 print:break-inside-avoid">
          <BarcodeSvg
            value={barcodePayload}
            boxClassName="h-[5.25rem] w-full max-w-[280px]"
            className="mx-auto"
            height={42}
          />
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Print this label
          </Button>
          <Link
            href="/attendance/barcode-labels"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            Class sheet (all stickers)
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-6 print:hidden">
        <h3 className="font-medium">Guardian</h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{student.parent_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{student.parent_phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{student.parent_email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Occupation</dt>
            <dd>{student.parent_occupation ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← Students
        </Link>
      </div>
    </div>
  );
}
