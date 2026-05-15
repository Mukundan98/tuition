"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ChartColumn,
  ChartPie,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import {
  AdminOverviewPieChart,
  AttendanceBarChart,
  FeeCurrencyColumnChart,
  PresenceMixDonut,
} from "@/components/dashboard/dashboard-apex-charts";
import { PendingFeesWidget } from "@/components/dashboard/pending-fees-widget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  DashboardAdminStats,
  DashboardParentStats,
  DashboardStudentStats,
  DashboardStudentProgress,
  DashboardTeacherStats,
} from "@/lib/types";

function DashboardCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}

function ChildProgressSection({ row }: { row: DashboardStudentProgress }) {
  const rate = row.attendance_rate_30d;
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div>
        <h3 className="text-lg font-semibold">{row.student?.name}</h3>
        <p className="text-sm text-muted-foreground">
          {row.class
            ? `Class ${row.class.name}${row.class.section ? ` · ${row.class.section}` : ""
            }`
            : "No class assigned"}
          {" · "}
          {row.student?.admission_number}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Attendance (30d)</p>
          <p className="text-xl font-semibold tabular-nums">
            {rate !== null && rate !== undefined ? `${rate}%` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {row.attendance_marked_30d ?? 0} days marked
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Fee balance</p>
          <p className="text-xl font-semibold tabular-nums">
            {row.fee_balance ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Upcoming exams</p>
          <ul className="mt-1 space-y-1 text-sm">
            {(row.upcoming_exams?.length ?? 0) === 0 ? (
              <li className="text-muted-foreground">None.</li>
            ) : (
              row.upcoming_exams?.slice(0, 4).map((ex) => (
                <li key={ex.id} className="flex justify-between gap-2">
                  <span className="truncate">{ex.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {ex.exam_date}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Recent marks</p>
        {(row.recent_results?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No results yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {row.recent_results?.map((r, i) => (
              <li
                key={`${r.exam_title}-${r.subject}-${i}`}
                className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
              >
                <span className="min-w-0 truncate">
                  {r.exam_title}
                  {r.subject ? ` · ${r.subject}` : ""}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.marks} ({r.grade ?? "—"})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function DashboardPageClient() {
  const { user, status } = useAuth();
  const slug = user?.role?.slug;

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const [adminData, setAdminData] = useState<DashboardAdminStats | null>(null);
  const [teacherData, setTeacherData] =
    useState<DashboardTeacherStats | null>(null);
  const [studentData, setStudentData] =
    useState<DashboardStudentStats | null>(null);
  const [parentData, setParentData] = useState<DashboardParentStats | null>(null);

  useEffect(() => {
    if (status !== "authed" || !slug) {
      return;
    }
    let cancelled = false;
    void (async () => {
      if (slug === "admin") {
        const r = await apiFetch<DashboardAdminStats>("dashboard/admin");
        if (!cancelled && r.json?.success && r.json.data) {
          setAdminData(r.json.data);
        }
      } else if (slug === "teacher") {
        const r = await apiFetch<DashboardTeacherStats>("dashboard/teacher");
        if (!cancelled && r.json?.success && r.json.data) {
          setTeacherData(r.json.data);
        }
      } else if (slug === "student") {
        const r = await apiFetch<DashboardStudentStats>("dashboard/student");
        if (!cancelled && r.json?.success && r.json.data) {
          setStudentData(r.json.data);
        }
      } else if (slug === "parent") {
        const r = await apiFetch<DashboardParentStats>("dashboard/parent");
        if (!cancelled && r.json?.success && r.json.data) {
          setParentData(r.json.data);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, status]);

  if (status === "loading" || status === "guest") {
    return (
      <DashboardCanvas>
        <Skeleton className="h-36 w-full max-w-xl rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </DashboardCanvas>
    );
  }

  if (slug === "admin") {
    if (!adminData) {
      return (
        <DashboardCanvas>
          <Skeleton className="h-40 w-full max-w-xl rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </DashboardCanvas>
      );
    }

    return (
      <DashboardCanvas>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LayoutDashboard className="size-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">Overview</span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.name ? `${user.name.split(" ")[0]}, ` : ""}
              here&apos;s today&apos;s snapshot · <span className="tabular-nums">{todayLabel}</span>
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden lg:col-span-2 rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white shadow-xl ring-1 ring-white/10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl"
            />
            <CardHeader className="relative space-y-2 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="size-4 text-teal-300" aria-hidden />
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-white/15">
                  Live
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Administrator overview
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-indigo-100/95">
                Students, teachers, classes, subjects, and upcoming exams — each slice is a share of the
                combined pool.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-3 pb-6">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-lg ring-4 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                <AdminOverviewPieChart stats={adminData} />
              </div>
              <p className="text-center text-[11px] text-indigo-100/80">
                Each slice is that count as a share of the total across all five metrics.
              </p>
            </CardContent>
          </Card>
          <PendingFeesWidget />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl border-border/60 bg-card/90 shadow-md backdrop-blur-sm lg:col-span-2">
            <CardHeader className="space-y-1 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <ChartColumn className="size-5 text-teal-600 dark:text-teal-400" aria-hidden />
                Attendance activity
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Marked vs present each day for the last seven days.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AttendanceBarChart series={adminData.attendance_series} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="rounded-3xl border-border/60 bg-card/90 shadow-md backdrop-blur-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <ChartPie className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Presence mix
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Present vs absent across the same window.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <PresenceMixDonut series={adminData.attendance_series} />
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/60 bg-card/90 shadow-md backdrop-blur-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <WalletCards className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  Fees snapshot
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">Rolled up from tuition records.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <FeeCurrencyColumnChart summary={adminData.fee_summary} />
                <div className="flex justify-between gap-2 border-t border-border/60 pt-3">
                  <span className="text-muted-foreground">Unpaid fee rows</span>
                  <span className="tabular-nums font-medium">
                    {adminData.fee_summary.unpaid_fee_records}
                  </span>
                </div>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Open reports hub →
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardCanvas>
    );
  }

  if (slug === "teacher") {
    if (!teacherData) {
      return (
        <DashboardCanvas>
          <div className="space-y-8">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
        </DashboardCanvas>
      );
    }

    if (!teacherData.has_profile) {
      return (
        <DashboardCanvas>
          <Card className="max-w-2xl border-dashed border-2 bg-muted/20">
            <CardHeader className="text-center">
              <Users className="mx-auto size-12 text-muted-foreground/50 mb-4" />
              <CardTitle className="text-xl">Teacher workspace</CardTitle>
              <CardDescription className="text-base">
                {teacherData.message ??
                  "Link a teacher profile to see classes and roster reach."}
              </CardDescription>
            </CardHeader>
          </Card>
        </DashboardCanvas>
      );
    }

    const series = teacherData.attendance_series ?? [];

    return (
      <DashboardCanvas>
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <LayoutDashboard className="size-4 text-indigo-500" />
                Teacher Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{todayLabel}</p>
              <p className="text-xs text-muted-foreground">Tuition center workspace</p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
            <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                <GraduationCap className="size-10 text-white" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h2>
                <p className="text-indigo-100 max-w-lg">
                  You have <span className="font-semibold text-white">{teacherData.subjects_assigned}</span> subjects
                  assigned across <span className="font-semibold text-white">{teacherData.classes_count}</span> classes today.
                  Your total student reach is <span className="font-semibold text-white">{teacherData.students_reachable}</span>.
                </p>
              </div>
              <div className="ml-auto hidden xl:block">
                <Sparkles className="size-12 text-indigo-300/40 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Subjects", value: teacherData.subjects_assigned, icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
            { label: "Classes", value: teacherData.classes_count, icon: Layers, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
            { label: "Students", value: teacherData.students_reachable, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Homerooms", value: teacherData.homeroom_classes, icon: GraduationCap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
          ].map((item) => (
            <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/80 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.label}
                </CardDescription>
                <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                  <item.icon className={cn("size-4", item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums tracking-tight">
                  {item.value ?? 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="relative rounded-3xl border-border/60 bg-card/90 shadow-lg backdrop-blur-sm lg:col-span-2 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ChartColumn className="size-5 text-indigo-500" />
                  Attendance overview
                </CardTitle>
                <CardDescription>Class attendance trends from the last 7 days.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {series.length > 0 ? (
                <AttendanceBarChart series={series} />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm italic">
                  No attendance data available for the past week.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-3xl border-border/60 bg-card/90 shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ChartPie className="size-5 text-emerald-500" />
                  Presence mix
                </CardTitle>
                <CardDescription>Overall session attendance ratio.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {series.length > 0 ? (
                  <PresenceMixDonut series={series} />
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm italic">
                    No presence data.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-card/90 shadow-lg backdrop-blur-sm overflow-hidden flex-1 group">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50 group-hover:bg-rose-500 transition-colors" />
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bell className="size-5 text-rose-500" />
                    Unread alerts
                  </CardTitle>
                  <CardDescription>Recent in-app notifications.</CardDescription>
                </div>
                <div className="bg-rose-500/10 rounded-full px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  {teacherData.unread_notifications ?? 0}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between pt-2">
                <p className="text-sm text-balance text-muted-foreground mb-4">
                  You have {teacherData.unread_notifications ?? 0} messages waiting in your dashboard inbox.
                </p>
                <Link
                  href="/notifications"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm font-semibold transition-all hover:bg-muted hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  View all alerts
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl border-border/60 bg-card/90 shadow-lg backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="size-5 text-indigo-500" />
              Upcoming Exams
            </CardTitle>
            <CardDescription>Scheduled assessments for classes you teach.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {(teacherData.upcoming_exams?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Calendar className="size-12 opacity-20 mb-2" />
                <p className="text-sm font-medium">No upcoming exams found.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {teacherData.upcoming_exams?.map((ex) => (
                  <div
                    key={ex.id}
                    className="group relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-all hover:border-indigo-500/30 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base truncate leading-tight">{ex.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Layers className="size-3.5" />
                          {ex.class?.name}{ex.class?.section ? ` · ${ex.class.section}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-lg bg-white dark:bg-zinc-900 border px-2 py-1 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 leading-none mb-0.5">
                          {ex.exam_date ? new Date(ex.exam_date).toLocaleString('default', { month: 'short' }) : '---'}
                        </span>
                        <span className="text-lg font-black leading-none tracking-tighter">
                          {ex.exam_date ? new Date(ex.exam_date).getDate() : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardCanvas>
    );
  }

  if (slug === "student") {
    if (!studentData) {
      return (
        <DashboardCanvas>
          <Skeleton className="h-48 w-full max-w-xl rounded-2xl" />
        </DashboardCanvas>
      );
    }

    if (!studentData.has_profile) {
      return (
        <DashboardCanvas>
          <Card className="rounded-3xl border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Student portal</CardTitle>
              <CardDescription>
                {studentData.message ??
                  "A student profile is required to track attendance and fees."}
              </CardDescription>
            </CardHeader>
          </Card>
        </DashboardCanvas>
      );
    }

    const rate = studentData.attendance_rate_30d;

    return (
      <DashboardCanvas>
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-sky-700 via-indigo-800 to-violet-950 text-white shadow-xl ring-1 ring-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),transparent_55%)]"
          />
          <CardHeader className="relative">
            <CardTitle className="text-white text-xl sm:text-2xl font-bold">
              Hello, {studentData.student?.name}
            </CardTitle>
            <CardDescription className="text-sky-100/95">
              {studentData.class
                ? `Class ${studentData.class.name}${studentData.class.section ? ` · ${studentData.class.section}` : ""
                }`
                : "No class assigned"}
              {" · "}
              {studentData.student?.admission_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-100/90">
                Attendance (30 days)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {rate !== null && rate !== undefined ? `${rate}%` : "—"}
              </p>
              <p className="text-[11px] text-sky-200">{studentData.attendance_marked_30d ?? 0} days marked</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-100/90">Fee balance</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{studentData.fee_balance ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-100/90">Alerts</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{studentData.unread_notifications ?? 0}</p>
              <Link
                href="/notifications"
                className="mt-1 inline-block text-[11px] text-white/90 underline-offset-2 hover:underline"
              >
                View inbox
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/60 bg-card/85 shadow-md backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-lg font-semibold">Upcoming exams</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {(studentData.upcoming_exams?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">None scheduled.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {studentData.upcoming_exams?.map((ex) => (
                    <li key={ex.id} className="flex justify-between gap-2">
                      <span>{ex.title}</span>
                      <span className="text-muted-foreground">{ex.exam_date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card/85 shadow-md backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-lg font-semibold">Recent results</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {(studentData.recent_results?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No marks yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {studentData.recent_results?.map((row, i) => (
                    <li
                      key={`${row.exam_title}-${row.subject}-${i}`}
                      className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
                    >
                      <span>
                        {row.exam_title}
                        {row.subject ? ` · ${row.subject}` : ""}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {row.marks} ({row.grade ?? "—"})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardCanvas>
    );
  }

  if (slug === "parent") {
    if (!parentData) {
      return (
        <DashboardCanvas>
          <Skeleton className="h-48 w-full max-w-xl rounded-2xl" />
        </DashboardCanvas>
      );
    }

    if (!parentData.has_children) {
      return (
        <DashboardCanvas>
          <Card className="rounded-3xl border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Parent portal</CardTitle>
              <CardDescription>{parentData.message}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Unread alerts:{" "}
                <span className="font-medium tabular-nums text-foreground">{parentData.unread_notifications}</span>
              </span>
              <Link href="/notifications" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Open alerts →
              </Link>
            </CardContent>
          </Card>
        </DashboardCanvas>
      );
    }

    const rows = parentData.children ?? [];

    return (
      <DashboardCanvas>
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 text-white shadow-xl ring-1 ring-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(255,255,255,0.15),transparent_50%)]"
          />
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-white sm:text-2xl">Family overview</CardTitle>
            <CardDescription className="text-teal-100/95">
              Showing {rows.length} linked learner{rows.length === 1 ? "" : "s"} from guardian contact details on
              file (email / phone).
            </CardDescription>
          </CardHeader>
          <CardContent className="relative text-sm">
            <p>
              Alerts:{" "}
              <span className="font-semibold tabular-nums">{parentData.unread_notifications}</span> unread ·{" "}
              <Link href="/notifications" className="font-medium underline-offset-2 hover:underline">
                Inbox
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {rows.map((row, idx) => (
            <ChildProgressSection key={`${row.student?.id}-${idx}`} row={row} />
          ))}
        </div>
      </DashboardCanvas>
    );
  }

  return (
    <DashboardCanvas>
      <Card className="rounded-3xl border-border/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Welcome</CardTitle>
          <CardDescription>
            Your role ({slug ?? "unknown"}) uses the shared dashboard shell. Contact an administrator for module
            access.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use <strong className="font-medium text-foreground">Alerts</strong> for school-wide messages.
        </CardContent>
      </Card>
    </DashboardCanvas>
  );
}
