"use client";

import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TimetableTeacherRow, TimetableTeacherStats } from "@/lib/types";
import { examClassLabel } from "@/lib/utils";
import { timetableDayLong, timetableDayOrder } from "@/lib/timetable-utils";
import { useCallback, useEffect, useState } from "react";

export function TimetableTeacherClient() {
  const [items, setItems] = useState<TimetableTeacherRow[]>([]);
  const [stats, setStats] = useState<TimetableTeacherStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<{
      items: TimetableTeacherRow[];
      stats: TimetableTeacherStats;
      message: string | null;
    }>("timetable/teacher");
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load timetable.");
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setStats(r.json.data.stats);
    setMessage(r.json.data.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = timetableDayOrder().map((d) => ({
    day: d,
    rows: items.filter((s) => s.day_of_week === d),
  }));

  const maxDay = stats
    ? Math.max(...Object.values(stats.by_day).map((n) => n), 1)
    : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Calendar className="size-4 text-indigo-500" />
              Teacher Portal
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
          <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <CalendarDays className="size-10 text-white" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold">Your Teaching Schedule</h2>
              <p className="text-indigo-100 max-w-lg">
                Manage your weekly teaching load, view session durations, and track assigned student groups across all subjects.
              </p>
            </div>
            <div className="ml-auto hidden xl:block">
              <Sparkles className="size-12 text-indigo-300/40 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </header>

      {err ? (
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive flex items-center gap-2">
            <span className="font-bold">Error:</span> {err}
          </p>
        </Card>
      ) : message ? (
        <Card className="border-amber-500/50 bg-amber-500/5 p-4 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 italic">
            {message}
          </p>
        </Card>
      ) : null}

      {stats ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Weekly Sessions", value: stats.total_sessions, icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
            { label: "Assigned Classes", value: stats.unique_classes, icon: GraduationCap, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
            {
              label: "Busiest Peak",
              value: stats.busiest_day ? stats.busiest_day.count : 0,
              subtitle: stats.busiest_day ? timetableDayLong(stats.busiest_day.day_of_week) : "None",
              icon: LayoutDashboard,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10"
            },
          ].map((item) => (
            <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/85 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.label}
                </CardDescription>
                <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                  <item.icon className={cn("size-4", item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold tabular-nums tracking-tight">
                    {item.value ?? 0}
                  </div>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground font-medium uppercase">{item.subtitle}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {stats ? (
        <Card className="rounded-3xl border-border/60 bg-card/90 shadow-lg backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LayoutDashboard className="size-5 text-indigo-500" />
              Sessions by weekday
            </CardTitle>
            <CardDescription>Relative teaching load across the current week.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="flex items-end justify-around h-40 gap-2 sm:gap-6">
              {timetableDayOrder().map((d) => {
                const n = stats.by_day[String(d)] ?? stats.by_day[d] ?? 0;
                const h = Math.max(4, Math.round((n / maxDay) * 100));
                return (
                  <div
                    key={d}
                    className="flex flex-col items-center gap-3 w-full group"
                  >
                    <div className="relative w-full max-w-[40px] flex items-end justify-center h-24">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-500 ease-out",
                          n > 0 ? "bg-indigo-500/80 group-hover:bg-indigo-500 shadow-lg" : "bg-muted/50"
                        )}
                        style={{ height: `${h}%` }}
                        title={`${n} sessions`}
                      />
                      {n > 0 && (
                        <span className="absolute -top-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {n}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tighter">
                        {timetableDayShortLabel(d)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Weekly Schedule</h2>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 rounded-2xl animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : items.length === 0 && !message ? (
          <Card className="rounded-3xl border-dashed border-2 bg-muted/20 p-12 text-center">
            <Clock className="mx-auto size-12 text-muted-foreground/50 mb-4" />
            <CardTitle>Empty Timetable</CardTitle>
            <CardDescription className="max-w-xs mx-auto mt-2">
              No sessions found. Contact your administrator to assign subjects and schedule periods.
            </CardDescription>
          </Card>
        ) : items.length > 0 ? (
          <div className="grid gap-8">
            {byDay.map(({ day, rows }) =>
              rows.length === 0 ? null : (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                      {timetableDayLong(day)}
                    </h3>
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {rows.length} {rows.length === 1 ? "Session" : "Sessions"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rows.map((row) => (
                      <Card
                        key={row.id}
                        className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/90 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/[0.05] transition-colors" />
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full">
                              <Clock className="size-3" />
                              {row.start_time}–{row.end_time}
                            </div>
                          </div>
                          <CardTitle className="text-base font-bold leading-tight line-clamp-1">
                            {row.subject ? row.subject.name : "Untitled Subject"}
                          </CardTitle>
                          <CardDescription className="text-[11px] font-semibold flex items-center gap-1">
                            <BookOpen className="size-3" />
                            {row.subject?.code ?? "N/A"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 border-t border-border/10">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Users className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">
                                {row.school_class ? examClassLabel(row.school_class) : "No class"}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                Assigned Students
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function timetableDayShortLabel(d: number): string {
  const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return labels[d] ?? String(d);
}
