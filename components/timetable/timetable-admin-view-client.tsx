"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  timetableDayShort,
  timetableDayLong,
  TIMETABLE_DAY_LABELS_SHORT,
} from "@/lib/timetable-utils";

/* ---------- types ---------- */
type ScheduleRow = {
  id: number;
  class_id: number;
  subject_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: { id: number; name: string; code: string } | null;
  teacher_name: string | null;
};

type ClassStats = {
  total_periods: number;
  days_with_class: number;
  distinct_subjects: number;
};

type ClassTimetable = {
  class: {
    id: number;
    name: string;
    section: string | null;
    academic_year: string | null;
  };
  schedules: ScheduleRow[];
  stats: ClassStats;
};

/* ---------- subject color palette ---------- */
const SUBJECT_COLORS = [
  {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800/60",
    text: "text-indigo-700 dark:text-indigo-300",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800/60",
    text: "text-violet-700 dark:text-violet-300",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800/60",
    text: "text-sky-700 dark:text-sky-300",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/60",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/60",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/60",
    text: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800/60",
    text: "text-teal-700 dark:text-teal-300",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-800/60",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
];

function getSubjectColor(subjectId: number) {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
}

/* ---------- time formatting ---------- */
function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ---------- stat card ---------- */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Calendar;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md",
        "bg-card"
      )}
    >
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]">
        <div className={cn("h-full w-full", color)} />
      </div>
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            color.replace("bg-", "bg-gradient-to-br from-") + " to-transparent",
            "text-white shadow-sm"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- period card ---------- */
function PeriodCard({ row }: { row: ScheduleRow }) {
  const colors = row.subject
    ? getSubjectColor(row.subject.id)
    : {
        bg: "bg-muted/40",
        border: "border-border",
        text: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
      };

  return (
    <div
      className={cn(
        "group rounded-lg border p-3 transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", colors.dot)} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn("text-sm font-semibold leading-tight", colors.text)}>
            {row.subject?.name ?? "Free period"}
          </p>
          {row.subject?.code && (
            <span
              className={cn(
                "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                colors.badge
              )}
            >
              {row.subject.code}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            <span>
              {formatTime(row.start_time)} – {formatTime(row.end_time)}
            </span>
          </div>
          {row.teacher_name && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GraduationCap className="size-3" />
              <span className="truncate">{row.teacher_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
export function TimetableAdminViewClient() {
  const [data, setData] = useState<ClassTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<{ classes: ClassTimetable[] }>("timetable/admin");
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      toast.error(r.json?.message ?? "Failed to load timetable.");
      return;
    }
    setData(r.json.data.classes);
    if (r.json.data.classes.length > 0 && activeClassId === null) {
      setActiveClassId(r.json.data.classes[0].class.id);
    }
  }, [activeClassId]);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeClass = useMemo(
    () => data.find((d) => d.class.id === activeClassId) ?? null,
    [data, activeClassId]
  );

  /* Group schedules by day_of_week */
  const byDay = useMemo(() => {
    if (!activeClass) return {};
    const m: Record<number, ScheduleRow[]> = {};
    for (let d = 0; d <= 6; d++) m[d] = [];
    for (const r of activeClass.schedules) {
      if (!m[r.day_of_week]) m[r.day_of_week] = [];
      m[r.day_of_week].push(r);
    }
    // Sort each day by start_time
    for (let d = 0; d <= 6; d++) {
      m[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return m;
  }, [activeClass]);

  /* Filter only days that have classes (Mon-Sat typically, skip empty) */
  const activeDays = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 0].filter(
      (d) => (byDay[d]?.length ?? 0) > 0
    );
  }, [byDay]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-medium">Loading timetables…</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Calendar className="size-12 opacity-40" />
          <p className="text-lg font-medium">No classes found</p>
          <p className="text-sm">Create classes and add schedules to view timetables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
            <Calendar className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
            <p className="text-sm text-muted-foreground">
              View weekly class schedules at a glance
            </p>
          </div>
        </div>
      </div>

      {/* Class Tabs */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b">
          <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-thin">
            {data.map((item) => {
              const isActive = item.class.id === activeClassId;
              return (
                <button
                  key={item.class.id}
                  type="button"
                  onClick={() => setActiveClassId(item.class.id)}
                  className={cn(
                    "relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    isActive
                      ? cn(
                          "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25",
                          "dark:from-indigo-500 dark:to-violet-500"
                        )
                      : cn(
                          "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          "dark:hover:bg-muted/40"
                        )
                  )}
                >
                  <LayoutGrid className="size-4" />
                  <span>{item.class.name}</span>
                  {item.class.section && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.class.section}
                    </span>
                  )}
                  {item.stats.total_periods > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      )}
                    >
                      {item.stats.total_periods}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        {activeClass && (
          <div className="border-b px-4 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                icon={Clock}
                label="Total Periods"
                value={activeClass.stats.total_periods}
                color="bg-indigo-500"
              />
              <StatCard
                icon={Calendar}
                label="Days with Classes"
                value={activeClass.stats.days_with_class}
                color="bg-violet-500"
              />
              <StatCard
                icon={BookOpen}
                label="Distinct Subjects"
                value={activeClass.stats.distinct_subjects}
                color="bg-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Weekly Grid */}
        <div className="p-4">
          {activeClass && activeClass.schedules.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Calendar className="size-8 opacity-40" />
                <p className="text-sm font-medium">No periods scheduled</p>
                <p className="text-xs">
                  Add periods from the{" "}
                  <a
                    href="/timetable/board"
                    className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Timetable Board
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: Full grid */}
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
                        {activeDays.map((d) => (
                          <th
                            key={d}
                            className={cn(
                              "border-b border-r last:border-r-0 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider",
                              "text-slate-600 dark:text-slate-300"
                            )}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{timetableDayLong(d)}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {byDay[d]?.length ?? 0} period
                                {(byDay[d]?.length ?? 0) !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {activeDays.map((d) => (
                          <td
                            key={d}
                            className="border-r last:border-r-0 align-top p-2"
                          >
                            <div className="flex flex-col gap-2">
                              {byDay[d]?.map((row) => (
                                <PeriodCard key={row.id} row={row} />
                              ))}
                              {(!byDay[d] || byDay[d].length === 0) && (
                                <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                                  No classes
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet: Stacked cards per day */}
              <div className="space-y-4 lg:hidden">
                {activeDays.map((d) => (
                  <div
                    key={d}
                    className="rounded-xl border overflow-hidden"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5",
                        "bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30",
                        "border-b"
                      )}
                    >
                      <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {timetableDayLong(d)}
                      </h3>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                        {byDay[d]?.length ?? 0} period
                        {(byDay[d]?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="divide-y">
                      {byDay[d]?.map((row) => (
                        <div key={row.id} className="p-2">
                          <PeriodCard row={row} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {activeDays.length === 0 && (
                  <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No periods scheduled for this class
                    </p>
                  </div>
                )}
              </div>

              {/* Subject legend */}
              {activeClass && activeClass.schedules.length > 0 && (
                <div className="mt-6 rounded-xl border bg-muted/20 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    Subjects
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Map(
                        activeClass.schedules
                          .filter((s) => s.subject)
                          .map((s) => [s.subject!.id, s.subject!])
                      ).values()
                    ).map((subject) => {
                      const colors = getSubjectColor(subject.id);
                      return (
                        <div
                          key={subject.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                            colors.bg,
                            colors.border,
                            colors.text
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              colors.dot
                            )}
                          />
                          {subject.name}
                          <span className="opacity-60">({subject.code})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
