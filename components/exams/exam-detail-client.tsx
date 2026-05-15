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
import { Button } from "@/components/ui/button";
import { apiFetch, apiJson } from "@/lib/api";
import type { ExamRow } from "@/lib/types";
import { ProfileDetailSkeleton } from "@/components/ui/table-skeleton";

type ExamDetail = ExamRow & { notes: string | null };

export function ExamDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delP, setDelP] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<{ exam: ExamDetail }>(`exams/${id}`);
    if (!r.ok || !r.json?.success || !r.json.data?.exam) {
      setErr(r.json?.message ?? "Not found");
      setExam(null);
      return;
    }
    setErr(null);
    setExam(r.json.data.exam);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    setDelP(true);
    await apiJson(`exams/${id}`, "DELETE");
    setDelP(false);
    setDelOpen(false);
    router.replace("/exams");
    router.refresh();
  }

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link href="/exams" className="text-sm text-muted-foreground hover:underline">
          ← Exams
        </Link>
      </div>
    );
  }

  if (!exam) {
    return <ProfileDetailSkeleton className="max-w-3xl" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/exams" className="text-sm text-muted-foreground hover:underline">
            ← Exams
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{exam.title}</h2>
          <p className="text-sm text-muted-foreground">
            {exam.school_class?.name}
            {exam.school_class?.section ? ` (${exam.school_class.section})` : ""} · {exam.exam_date} · max{" "}
            {exam.max_marks} / subject
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/exams/${exam.id}/marks`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
          >
            Enter marks
          </Link>
          <Link
            href={`/exams/${exam.id}/results`}
            className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted"
          >
            Results
          </Link>
          <Link href="/exams" className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted">
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
            <AlertDialogTitle>Delete exam</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes this exam and all marks for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delP}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {exam.notes && (
        <div className="rounded-xl border bg-card p-5 text-sm">
          <h3 className="mb-2 font-medium">Notes</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">{exam.notes}</p>
        </div>
      )}
    </div>
  );
}
