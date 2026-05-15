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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { apiFetch, apiJson } from "@/lib/api";
import { parseApiErrors } from "@/lib/api-errors";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SubjectOpt = {
  id: number;
  name: string;
  code: string;
};

type ScheduleRowApi = {
  id: number;
  subject_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: SubjectOpt | null;
};

export default function ClassDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const cid = Number(id);

  const [detail, setDetail] = useState<{
    name: string;
    max_students: number | null;
    homeroom_teacher?: { id: number; employee_id?: string | null; name: string | null } | null;
    subjects_count: number;
    students_count: number;
    subjects: SubjectOpt[];
  } | null>(null);
  const [draft, setDraft] = useState<
    Array<{ k: string; subject_id: string; day_of_week: string; start_time: string; end_time: string }>
  >([]);
  const [err, setErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, setPending] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    const r = await apiFetch<{
      school_class: {
        name: string;
        max_students: number | null;
        homeroom_teacher: { id: number; employee_id?: string | null; name: string | null } | null;
        subjects_count: number;
        students_count: number;
        subjects: SubjectOpt[];
      };
    }>(`classes/${id}`);
    if (!r.ok || !r.json?.success || !r.json.data?.school_class) {
      setErr(r.json?.message ?? "Not found");
      setDetail(null);
      return;
    }
    setErr(null);
    const c = r.json.data.school_class;
    setDetail({
      name: c.name,
      max_students: c.max_students,
      homeroom_teacher: c.homeroom_teacher,
      subjects_count: c.subjects_count,
      students_count: c.students_count,
      subjects: c.subjects ?? [],
    });
  }, [id]);

  const loadSchedules = useCallback(async () => {
    const r = await apiFetch<{ schedules: ScheduleRowApi[] }>(
      `classes/${id}/schedules`
    );
    if (r.ok && r.json?.success && r.json.data?.schedules) {
      const list = r.json.data.schedules;
      setDraft(
        list.map((row) => ({
          k: `e-${row.id}`,
          subject_id: row.subject_id != null ? String(row.subject_id) : "",
          day_of_week: String(row.day_of_week),
          start_time: row.start_time,
          end_time: row.end_time,
        }))
      );
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
    void loadSchedules();
  }, [loadDetail, loadSchedules]);

  async function saveSchedules() {
    setPending(true);
    setSaveMsg(null);
    setScheduleFieldErrors(null);
    const body = {
      schedules: draft.map((d) => ({
        subject_id:
          d.subject_id && d.subject_id !== "" ? Number(d.subject_id) : null,
        day_of_week: Number(d.day_of_week),
        start_time: d.start_time,
        end_time: d.end_time,
      })),
    };
    const r = await apiJson<{ schedules: ScheduleRowApi[] }>(
      `classes/${id}/schedules`,
      "PUT",
      body
    );
    setPending(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        setScheduleFieldErrors(parsed);
        return;
      }
      setSaveMsg(r.json?.message ?? "Could not save schedule.");
      return;
    }
    setScheduleFieldErrors(null);
    setSaveMsg("Schedule saved.");
    void loadSchedules();
  }

  async function destroy() {
    setPending(true);
    await apiJson(`classes/${id}`, "DELETE");
    setPending(false);
    router.replace("/classes");
  }

  if (err || !detail) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-destructive">{err ?? "…"}</p>
        <Link href="/classes" className="text-sm text-muted-foreground hover:underline">
          ← Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/classes" className="text-xs text-muted-foreground hover:underline">
            ← Classes
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">
            Students: {detail.students_count} · Subjects: {detail.subjects_count}
          </p>
          <p className="mt-2 text-sm">
            Homeroom:{" "}
            <span className="text-muted-foreground">
              {detail.homeroom_teacher
                ? detail.homeroom_teacher.name ??
                  (detail.homeroom_teacher.employee_id
                    ? `#${detail.homeroom_teacher.employee_id}`
                    : "—")
                : "All"}
            </span>
          </p>
          {detail.max_students != null && (
            <p className="text-sm text-muted-foreground">Max seats: {detail.max_students}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/classes"
            className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted"
          >
            Edit class
          </Link>
          <Link
            href={`/subjects?class_id=${cid}`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Add subject
          </Link>
          <Button variant="destructive" type="button" onClick={() => setDelOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes subjects and timetable rows for this class. Students stay in the directory
              with no class assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={destroy}
            >
              Delete class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex justify-between gap-2">
          <h3 className="font-semibold">Weekly timetable</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setDraft([
            ...draft,
            {
              k: `n-${crypto.randomUUID()}`,
              subject_id: "",
              day_of_week: "1",
              start_time: "09:00",
              end_time: "10:00",
            },
          ])}>
            Add row
          </Button>
        </div>

        <div className="space-y-3">
          {draft.map((row, i) => (
            <div
              key={row.k}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-12"
            >
              <div className="lg:col-span-3 space-y-1">
                <Label className="text-xs">Subject (optional)</Label>
                <select
                  value={row.subject_id}
                  onChange={(e) => {
                    const v = [...draft];
                    v[i].subject_id = e.target.value;
                    setDraft(v);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Break / assembly</option>
                  {detail.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-3 space-y-1">
                <Label className="text-xs">Day</Label>
                <select
                  value={row.day_of_week}
                  onChange={(e) => {
                    const v = [...draft];
                    v[i].day_of_week = e.target.value;
                    setDraft(v);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {DAYS.map((label, dow) => (
                    <option key={label} value={dow}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2 space-y-1">
                <Label className="text-xs">Start</Label>
                <Input
                  type="time"
                  value={row.start_time}
                  onChange={(e) => {
                    const v = [...draft];
                    v[i].start_time = e.target.value;
                    setDraft(v);
                  }}
                />
              </div>
              <div className="lg:col-span-2 space-y-1">
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  value={row.end_time}
                  onChange={(e) => {
                    const v = [...draft];
                    v[i].end_time = e.target.value;
                    setDraft(v);
                  }}
                />
              </div>
              <div className="flex items-end lg:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {scheduleFieldErrors && <ApiValidationSummary errors={scheduleFieldErrors} />}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void saveSchedules()} disabled={pending}>
            Save timetable
          </Button>
          {saveMsg && <span className="text-sm text-muted-foreground">{saveMsg}</span>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Subjects</h3>
        {detail.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subjects yet.{" "}
            <Link href={`/subjects?class_id=${cid}`} className="text-indigo-600 underline">
              Create one.
            </Link>
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.subjects.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  {s.name} <span className="text-muted-foreground">({s.code})</span>
                </span>
                <Link href="/subjects" className="text-muted-foreground hover:underline">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
