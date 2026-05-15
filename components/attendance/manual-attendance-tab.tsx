"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { apiFetch, apiJson } from "@/lib/api";
import { parseApiErrors } from "@/lib/api-errors";
import type {
  AttendanceCalendarDay,
  AttendanceDayStudentRow,
  SchoolClassRow,
} from "@/lib/types";

const STATUSES = ["present", "absent", "late", "excused"] as const;

type StatsPayload = {
  enrollment: number;
  records: number;
  by_status: Record<string, number>;
  present_rate_percent: number | null;
};

type DayDraft = Record<number, { status: string; remark: string }>;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cellColor(day: AttendanceCalendarDay): string {
  if (day.enrollment <= 0) return "rgb(243 244 246)";
  if (day.marked === 0) return "rgb(229 231 235)";
  const ratio = day.present / day.marked;
  const l = 88 - ratio * 28;
  return `hsl(142 55% ${l}%)`;
}

export function ManualAttendanceTab() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayISO);
  const [rows, setRows] = useState<AttendanceDayStudentRow[]>([]);
  const [draft, setDraft] = useState<DayDraft>({});
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = useState<Record<string, string[]> | null>(null);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calendar, setCalendar] = useState<AttendanceCalendarDay[]>([]);

  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) {
        const list = r.json.data.items;
        setClasses(list);
        setClassId((prev) => prev || (list[0]?.id != null ? String(list[0].id) : ""));
      }
    })();
  }, []);

  const loadDay = useCallback(async () => {
    if (!classId || !date) return;
    setLoading(true);
    setSaveMsg(null);
    const r = await apiFetch<{ students: AttendanceDayStudentRow[] }>(
      `classes/${classId}/attendances/day?date=${encodeURIComponent(date)}`
    );
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data?.students) {
      setRows([]);
      setDraft({});
      return;
    }
    setRows(r.json.data.students);
    const d: DayDraft = {};
    for (const s of r.json.data.students) {
      const a = s.attendance;
      d[s.student_id] = {
        status: a?.status ?? "present",
        remark: a?.remark ?? "",
      };
    }
    setDraft(d);
  }, [classId, date]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  const loadCalendar = useCallback(async () => {
    if (!classId) {
      setCalendar([]);
      setStats(null);
      return;
    }
    const r = await apiFetch<{ days: AttendanceCalendarDay[] }>(
      `attendances/calendar?class_id=${classId}&year=${calYear}&month=${calMonth}`
    );
    if (r.json?.success && r.json.data?.days) {
      setCalendar(r.json.data.days);
    } else {
      setCalendar([]);
    }

    const from = `${calYear}-${String(calMonth).padStart(2, "0")}-01`;
    const last = new Date(calYear, calMonth, 0).getDate();
    const to = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    const s = await apiFetch<StatsPayload>(
      `attendances/stats?class_id=${classId}&from=${from}&to=${to}`
    );
    if (s.json?.success && s.json.data) {
      setStats(s.json.data);
    } else {
      setStats(null);
    }
  }, [classId, calYear, calMonth]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  function bumpMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    setCalMonth(m);
    setCalYear(y);
  }

  function markAll(status: string) {
    const d: DayDraft = { ...draft };
    for (const s of rows) {
      d[s.student_id] = { ...(d[s.student_id] ?? { status: "present", remark: "" }), status };
    }
    setDraft(d);
  }

  async function save() {
    if (!classId || !date || rows.length === 0) return;
    setSaveMsg(null);
    setSaveFieldErrors(null);
    const items = rows.map((s) => ({
      student_id: s.student_id,
      status: draft[s.student_id]?.status ?? "present",
      remark: draft[s.student_id]?.remark?.trim() || undefined,
    }));
    const r = await apiJson(`classes/${classId}/attendances/bulk`, "POST", {
      date,
      items,
    });
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        setSaveFieldErrors(parsed);
        return;
      }
      setSaveMsg((r.json?.message as string | undefined) ?? "Save failed");
      return;
    }
    setSaveFieldErrors(null);
    setSaveMsg(null);
    void loadDay();
    void loadCalendar();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="hidden h-9 w-1 rounded-full bg-teal-600 sm:block dark:bg-teal-500" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Day sheet</h3>
          <p className="text-sm text-muted-foreground">
            Choose class and session date, edit statuses, then save the full day at once.
          </p>
        </div>
      </div>

      <Card size="sm" className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-teal-700 dark:text-teal-400" aria-hidden />
            Class &amp; date
          </CardTitle>
          <CardDescription>Filters apply to the table and monthly overview below.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual_class_id">Class</Label>
              <select
                id="manual_class_id"
                className="flex h-10 min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.section ? ` (${c.section})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual_adate">Date</Label>
              <Input
                id="manual_adate"
                type="date"
                className="h-10 w-full min-w-[10.5rem] rounded-lg shadow-sm sm:w-44"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" className="h-10" onClick={() => void loadDay()} disabled={loading}>
              Refresh sheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {saveFieldErrors && <ApiValidationSummary errors={saveFieldErrors} />}

      {saveMsg && <p className="text-sm text-destructive">{saveMsg}</p>}

      <Card className="overflow-hidden border-border/70 p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-11 font-semibold">Student</TableHead>
              <TableHead className="h-11 font-semibold">Admission</TableHead>
              <TableHead className="h-11 font-semibold">Status</TableHead>
              <TableHead className="h-11 font-semibold">Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={4} />}
            {!loading && classId && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No students in this class.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((s) => (
                <TableRow key={s.student_id} className="border-border/50 odd:bg-muted/[0.35]">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_number}</TableCell>
                  <TableCell>
                    <select
                      className="flex h-9 min-w-[7.5rem] rounded-lg border border-input bg-background px-2.5 text-sm capitalize shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={draft[s.student_id]?.status ?? "present"}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [s.student_id]: {
                            status: e.target.value,
                            remark: prev[s.student_id]?.remark ?? "",
                          },
                        }))
                      }
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-9 rounded-lg shadow-sm"
                      value={draft[s.student_id]?.remark ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [s.student_id]: {
                            status: prev[s.student_id]?.status ?? "present",
                            remark: e.target.value,
                          },
                        }))
                      }
                      placeholder="Optional"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {rows.length > 0 && (
          <CardFooter className="flex flex-wrap gap-2 border-t border-border/70 bg-muted/25">
            <Button type="button" variant="outline" size="sm" onClick={() => markAll("present")}>
              All present
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => markAll("absent")}>
              All absent
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void save()}
              className="ml-auto shadow-sm"
            >
              Save day
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card size="sm" className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base">Monthly heatmap</CardTitle>
            <CardDescription className="mt-1 max-w-lg">
              Each cell is one day (deeper green = more present among marked). Gray = nothing marked yet.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/30 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => bumpMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[5.5rem] text-center text-sm font-semibold tabular-nums">
              {calYear}-{String(calMonth).padStart(2, "0")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => bumpMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
        {stats && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 shadow-sm">
              <dt className="text-xs font-medium text-muted-foreground">Records (month)</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stats.records}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 shadow-sm">
              <dt className="text-xs font-medium text-muted-foreground">Present rate %</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stats.present_rate_percent ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 shadow-sm">
              <dt className="text-xs font-medium text-muted-foreground">Present / absent / late</dt>
              <dd className="mt-1 tabular-nums font-medium">
                {stats.by_status?.present ?? 0} / {stats.by_status?.absent ?? 0} /{" "}
                {stats.by_status?.late ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 shadow-sm">
              <dt className="text-xs font-medium text-muted-foreground">Enrollment</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stats.enrollment}</dd>
            </div>
          </dl>
        )}

        {classId && calendar.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-border/80 bg-muted/15 p-3">
            {calendar.map((day) => {
              const iso = day.date;
              const isSel = iso === date;
              return (
                <button
                  key={iso}
                  type="button"
                  title={`${iso}: marked ${day.marked}/${day.enrollment}, present ${day.present}`}
                  onClick={() => {
                    setDate(iso);
                  }}
                  className={`h-8 w-8 rounded-md text-[10px] font-semibold leading-none shadow-sm ring-1 ring-black/[0.04] transition hover:scale-105 hover:ring-2 hover:ring-teal-500/50 dark:ring-white/10 ${
                    isSel ? "ring-2 ring-teal-600 dark:ring-teal-400" : ""
                  }`}
                  style={{ backgroundColor: cellColor(day) }}
                >
                  {Number(iso.slice(8))}
                </button>
              );
            })}
          </div>
        )}
        {!classId && (
          <p className="text-sm text-muted-foreground">Pick a class to load the calendar.</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
