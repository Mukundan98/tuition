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
import type {
  TimetableStudentClass,
  TimetableStudentRow,
  TimetableStudentStats,
} from "@/lib/types";
import { timetableDayLong, timetableDayOrder } from "@/lib/timetable-utils";
import { useCallback, useEffect, useState } from "react";

export function TimetableStudentClient() {
  const [classInfo, setClassInfo] = useState<TimetableStudentClass | null>(null);
  const [schedules, setSchedules] = useState<TimetableStudentRow[]>([]);
  const [stats, setStats] = useState<TimetableStudentStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<{
      class: TimetableStudentClass | null;
      schedules: TimetableStudentRow[];
      stats: TimetableStudentStats;
      message: string | null;
    }>("timetable/student");
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load timetable.");
      return;
    }
    setErr(null);
    setClassInfo(r.json.data.class);
    setSchedules(r.json.data.schedules);
    setStats(r.json.data.stats);
    setMessage(r.json.data.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = timetableDayOrder().map((d) => ({
    day: d,
    rows: schedules.filter((s) => s.day_of_week === d),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="size-4 text-indigo-500" />
              Student Portal
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your Academic Schedule</h1>
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
              <h2 className="text-2xl font-bold">Stay Organised, Stay Ahead</h2>
              <p className="text-indigo-100 max-w-lg">
                View your weekly class schedule, subject information, and assigned teachers for each period.
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
          <p className="text-sm text-destructive flex items-center gap-2 font-medium">
            <span className="font-bold uppercase tracking-tighter bg-destructive/20 px-1.5 py-0.5 rounded">Error</span> {err}
          </p>
        </Card>
      ) : message ? (
        <Card className="border-amber-500/50 bg-amber-500/5 p-4 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 italic">
            {message}
          </p>
        </Card>
      ) : null}

      {stats && classInfo ? (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "My Primary Class", value: `${classInfo.name}${classInfo.section ? ` · ${classInfo.section}` : ""}`, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-500/10" },
            { label: "Periods Per Week", value: stats.total_periods, icon: Clock, color: "text-purple-600", bg: "bg-purple-500/10" },
            { label: "Enrolled Subjects", value: stats.distinct_subjects, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          ].map((item) => (
            <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/85 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {item.label}
                </CardDescription>
                <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                  <item.icon className={cn("size-4", item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground/90">
                  {item.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="size-5 text-indigo-500" />
            Weekly Timetable Overview
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 rounded-2xl animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : schedules.length === 0 && !message ? (
          <Card className="rounded-3xl border-dashed border-2 bg-muted/20 p-12 text-center">
            <LayoutDashboard className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">Nothing Scheduled</CardTitle>
            <CardDescription className="max-w-xs mx-auto mt-2">
              Your timetable is currently empty. Check back once your subjects and class sections are assigned.
            </CardDescription>
          </Card>
        ) : schedules.length > 0 ? (
          <div className="grid gap-8">
            {byDay.map(({ day, rows }) =>
              rows.length === 0 ? null : (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                      {timetableDayLong(day)}
                    </h3>
                    <div className="h-px flex-1 bg-border/40" />
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">
                      {rows.length} {rows.length === 1 ? "Period" : "Periods"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rows.map((row) => (
                      <Card
                        key={row.id}
                        className="group relative overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.02] rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/[0.05] transition-colors" />
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-lg">
                              <Clock className="size-3" />
                              {row.start_time}–{row.end_time}
                            </div>
                          </div>
                          <CardTitle className="text-base font-bold leading-tight group-hover:text-indigo-600 transition-colors">
                            {row.subject ? row.subject.name : "Untitled Subject"}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1 uppercase tracking-wider">
                            <BookOpen className="size-3" />
                            {row.subject?.code ?? "N/A"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 border-t border-border/10">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                              <Users className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                Principal Teacher
                              </p>
                              <p className="text-xs font-bold truncate text-foreground/80">
                                {row.teacher_name ?? "Substitute Teacher"}
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
