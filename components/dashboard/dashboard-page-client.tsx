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
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <LayoutDashboard className="size-4 text-teal-600 dark:text-teal-400" />
                Administrator Workspace
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{todayLabel}</p>
              <p className="text-xs text-muted-foreground">Tuition center controls</p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-950 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
            <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                <LayoutDashboard className="size-10 text-teal-300" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "Admin"}!</h2>
                <p className="text-indigo-200/90 max-w-2xl text-sm leading-relaxed">
                  Here is your central administrative workspace. You have full oversight over <span className="font-semibold text-white">{adminData.students_count} students</span> and <span className="font-semibold text-white">{adminData.teachers_count} teachers</span> across <span className="font-semibold text-white">{adminData.classes_count} active classes</span>. Keep track of attendance rates, exam distributions, and tuition fee records.
                </p>
              </div>
              <div className="ml-auto hidden xl:block">
                <Sparkles className="size-12 text-teal-300/35 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Students", value: adminData.students_count, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Teachers", value: adminData.teachers_count, icon: GraduationCap, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
            { label: "Classes", value: adminData.classes_count, icon: Layers, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { label: "Subjects", value: adminData.subjects_count, icon: BookOpen, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { label: "Upcoming Exams", value: adminData.exams_upcoming, icon: Calendar, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          ].map((item) => (
            <Card key={item.label} className={`group relative overflow-hidden rounded-2xl border ${item.border} bg-card/85 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.label}
                </CardDescription>
                <div className={`rounded-lg p-2 transition-colors ${item.bg}`}>
                  <item.icon className={`size-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                  {item.value ?? 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden lg:col-span-2 rounded-[2rem] border-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:shadow-2xl">
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
                Directory distribution
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-indigo-100/95">
                Students, teachers, classes, subjects, and upcoming exams share in the recorded directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-3 pb-6">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-lg ring-4 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                <AdminOverviewPieChart stats={adminData} />
              </div>
              <p className="text-center text-[11px] text-indigo-100/80">
                Shows recorded entries relative to the total directory pool.
              </p>
            </CardContent>
          </Card>
          <PendingFeesWidget />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden group lg:col-span-2">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500/50 group-hover:bg-teal-500 transition-all duration-300" />
            <CardHeader className="space-y-1 border-b border-border/50 pb-4 pl-6">
              <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <ChartColumn className="size-5 text-teal-600 dark:text-teal-400" aria-hidden />
                Attendance activity
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Marked vs present each day for the last seven days.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pl-6">
              <AttendanceBarChart series={adminData.attendance_series} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-all duration-300" />
              <CardHeader className="border-b border-border/50 pb-4 pl-6">
                <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <ChartPie className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Presence mix
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Present vs absent across the same window.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pl-6">
                <PresenceMixDonut series={adminData.attendance_series} />
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-all duration-300" />
              <CardHeader className="border-b border-border/50 pb-4 pl-6">
                <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <WalletCards className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  Fees snapshot
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">Rolled up from tuition records.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm pl-6">
                <FeeCurrencyColumnChart summary={adminData.fee_summary} />
                <div className="flex justify-between gap-2 border-t border-border/60 pt-3">
                  <span className="text-muted-foreground">Unpaid fee rows</span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {adminData.fee_summary.unpaid_fee_records}
                  </span>
                </div>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                <GraduationCap className="size-4 text-indigo-500 dark:text-indigo-400" />
                Teacher Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{todayLabel}</p>
              <p className="text-xs text-muted-foreground">Your teaching workspace</p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-700 via-violet-800 to-purple-900 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute top-0 right-0 size-48 rounded-full bg-violet-400/10 blur-3xl" />
            <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-inner">
                <GraduationCap className="size-10 text-indigo-200" />
              </div>
              <div className="text-center md:text-left space-y-2 flex-1">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0]}!</h2>
                <p className="text-indigo-100/85 max-w-xl text-sm leading-relaxed">
                  You are managing <span className="font-semibold text-white">{teacherData.subjects_assigned} subjects</span> across <span className="font-semibold text-white">{teacherData.classes_count} classes</span> with a total student reach of <span className="font-semibold text-white">{teacherData.students_reachable} students</span>.
                  {(teacherData.unread_notifications ?? 0) > 0 && (
                    <> You have <span className="font-semibold text-rose-300">{teacherData.unread_notifications} unread alert{(teacherData.unread_notifications ?? 0) !== 1 ? "s" : ""}</span> waiting.</>
                  )}
                </p>
              </div>
              <div className="ml-auto hidden xl:block shrink-0">
                <Sparkles className="size-14 text-indigo-300/30 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Subjects", value: teacherData.subjects_assigned, icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Classes", value: teacherData.classes_count, icon: Layers, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { label: "Students", value: teacherData.students_reachable, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Homerooms", value: teacherData.homeroom_classes, icon: GraduationCap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          ].map((item) => (
            <Card key={item.label} className={`group relative overflow-hidden rounded-2xl border ${item.border} bg-card/85 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.label}
                </CardDescription>
                <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                  <item.icon className={cn("size-4", item.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                  {item.value ?? 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="relative rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md lg:col-span-2 overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 pl-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ChartColumn className="size-5 text-indigo-500" />
                  Attendance overview
                </CardTitle>
                <CardDescription>Class attendance trends from the last 7 days.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pl-6">
              {series.length > 0 ? (
                <AttendanceBarChart series={series} />
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ChartColumn className="size-12 opacity-20" />
                  <p className="text-sm italic">No attendance data available for the past week.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md overflow-hidden group relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-all duration-300" />
              <CardHeader className="border-b border-border/50 pb-4 pl-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ChartPie className="size-5 text-emerald-500" />
                  Presence mix
                </CardTitle>
                <CardDescription>Overall session attendance ratio.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pl-6">
                {series.length > 0 ? (
                  <PresenceMixDonut series={series} />
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground">
                    <ChartPie className="size-10 opacity-20" />
                    <p className="text-sm italic">No presence data.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md overflow-hidden flex-1 group relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/50 group-hover:bg-rose-500 transition-all duration-300" />
              <CardHeader className="pb-3 flex flex-row items-center justify-between pl-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bell className="size-5 text-rose-500" />
                    Unread alerts
                  </CardTitle>
                  <CardDescription>Recent in-app notifications.</CardDescription>
                </div>
                <div className={cn(
                  "rounded-full px-3 py-1 text-sm font-black tabular-nums",
                  (teacherData.unread_notifications ?? 0) > 0
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/25"
                    : "bg-muted text-muted-foreground"
                )}>
                  {teacherData.unread_notifications ?? 0}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between pt-2 pl-6">
                <p className="text-sm text-balance text-muted-foreground mb-4">
                  {(teacherData.unread_notifications ?? 0) > 0
                    ? `You have ${teacherData.unread_notifications} message${(teacherData.unread_notifications ?? 0) !== 1 ? "s" : ""} waiting in your inbox.`
                    : "Your inbox is all caught up. Great work!"}
                </p>
                <Link
                  href="/notifications"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  <Bell className="size-4" />
                  View all alerts
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-md overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500/50 group-hover:bg-violet-500 transition-all duration-300" />
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-3xl" />
          <CardHeader className="border-b border-border/50 pb-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-violet-500" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription>Scheduled assessments for classes you teach.</CardDescription>
              </div>
              {(teacherData.upcoming_exams?.length ?? 0) > 0 && (
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                  {teacherData.upcoming_exams?.length} exam{(teacherData.upcoming_exams?.length ?? 0) !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 pl-6">
            {(teacherData.upcoming_exams?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                <Calendar className="size-14 opacity-15" />
                <div>
                  <p className="text-sm font-semibold">No upcoming exams</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Scheduled assessments will appear here</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {teacherData.upcoming_exams?.map((ex) => (
                  <div
                    key={ex.id}
                    className="group/card relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 transition-all duration-200 hover:border-violet-500/30 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base truncate leading-tight">{ex.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Layers className="size-3.5 shrink-0" />
                          <span className="truncate">{ex.class?.name}{ex.class?.section ? ` · ${ex.class.section}` : ""}</span>
                        </p>
                      </div>
                      <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 border border-violet-200/50 dark:border-violet-800/30 px-3 py-2 shadow-sm flex flex-col items-center min-w-[52px]">
                        <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 leading-none mb-0.5">
                          {ex.exam_date ? new Date(ex.exam_date).toLocaleString("default", { month: "short" }) : "---"}
                        </span>
                        <span className="text-xl font-black leading-none tracking-tighter text-foreground">
                          {ex.exam_date ? new Date(ex.exam_date).getDate() : "--"}
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
        <header className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <GraduationCap className="size-4 text-sky-500 dark:text-sky-400" />
                Student Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{todayLabel}</p>
              <p className="text-xs text-muted-foreground">Your academic overview</p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-sky-600 via-indigo-700 to-violet-800 text-white shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-0 right-0 size-56 rounded-full bg-sky-300/10 blur-3xl" />

            <CardContent className="relative flex flex-col md:flex-row items-center gap-4 p-5 sm:p-6">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <GraduationCap className="size-8 text-sky-100 drop-shadow-md" />
              </div>

              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    Hello, {studentData.student?.name}
                  </h2>
                  <p className="text-sky-100/90 text-xs font-medium flex items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 font-semibold ring-1 ring-white/20 backdrop-blur-sm">
                      {studentData.class
                        ? `Class ${studentData.class.name}${studentData.class.section ? ` · ${studentData.class.section}` : ""}`
                        : "No class assigned"}
                    </span>
                    <span className="opacity-60">•</span>
                    <span className="tracking-wide">{studentData.student?.admission_number}</span>
                  </p>
                </div>
                <p className="text-sky-50/80 max-w-2xl text-xs sm:text-sm leading-relaxed mt-1">
                  Welcome to your learning dashboard. Here you can track your attendance, upcoming exams, recent results, and fee status. Keep up the great work!
                </p>
              </div>

              <div className="ml-auto hidden lg:block shrink-0 px-4">
                <Sparkles className="size-12 text-sky-200/40 animate-pulse drop-shadow-lg" />
              </div>
            </CardContent>
          </Card>
        </header>

        <section className="grid gap-4 sm:grid-cols-3 mb-8">
          {/* Attendance Stat Card */}
          <Card className="group relative overflow-hidden rounded-[1.5rem] border-border/50 bg-card/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card hover:border-sky-500/30 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500/50 group-hover:bg-sky-500 transition-all duration-300" />
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-sky-500/5 blur-2xl group-hover:bg-sky-500/10 transition-colors" />

            <CardHeader className="pb-2 flex flex-row items-center justify-between pl-6 relative">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Attendance (30 days)
              </CardDescription>
              <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20 group-hover:bg-sky-500 group-hover:text-white group-hover:ring-sky-500 transition-all duration-300">
                <Calendar className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-6 relative">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                  {rate !== null && rate !== undefined ? `${rate}%` : "—"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground/80 mt-1">
                {studentData.attendance_marked_30d ?? 0} days marked present
              </p>
            </CardContent>
          </Card>

          {/* Fee Balance Stat Card */}
          <Card className="group relative overflow-hidden rounded-[1.5rem] border-border/50 bg-card/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card hover:border-indigo-500/30 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-all duration-300" />
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

            <CardHeader className="pb-2 flex flex-row items-center justify-between pl-6 relative">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Fee Balance
              </CardDescription>
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white group-hover:ring-indigo-500 transition-all duration-300">
                <WalletCards className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-6 relative">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                  {studentData.fee_balance ?? 0}
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground/80 mt-1">
                Current outstanding amount
              </p>
            </CardContent>
          </Card>

          {/* Alerts Stat Card */}
          <Card className="group relative overflow-hidden rounded-[1.5rem] border-border/50 bg-card/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card hover:border-rose-500/30 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/50 group-hover:bg-rose-500 transition-all duration-300" />
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-colors" />

            <CardHeader className="pb-2 flex flex-row items-center justify-between pl-6 relative">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Unread Alerts
              </CardDescription>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 group-hover:bg-rose-500 group-hover:text-white group-hover:ring-rose-500 transition-all duration-300">
                <Bell className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-6 relative">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                  {studentData.unread_notifications ?? 0}
                </span>
              </div>
              <Link
                href="/notifications"
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline transition-colors"
              >
                View inbox →
              </Link>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Exams Card */}
          <Card className="group relative overflow-hidden rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500/50 group-hover:bg-violet-500 transition-all duration-300" />
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

            <CardHeader className="border-b border-border/50 pb-4 pl-6 pr-6 flex flex-row justify-between items-center bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <Calendar className="size-5 text-violet-500" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription className="text-sm">Your scheduled assessments</CardDescription>
              </div>
              {(studentData.upcoming_exams?.length ?? 0) > 0 && (
                <div className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20 shadow-sm">
                  {studentData.upcoming_exams?.length} Exam{(studentData.upcoming_exams?.length ?? 0) !== 1 ? "s" : ""}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {(studentData.upcoming_exams?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                  <Calendar className="size-16 opacity-10" />
                  <div>
                    <p className="text-base font-semibold">No exams scheduled</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">You have no upcoming assessments</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {studentData.upcoming_exams?.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/30 px-3 py-2 text-center shadow-sm min-w-[60px]">
                          <span className="block text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 leading-none mb-1">
                            {ex.exam_date ? new Date(ex.exam_date).toLocaleString("default", { month: "short" }) : "---"}
                          </span>
                          <span className="block text-xl font-black leading-none tracking-tighter text-foreground">
                            {ex.exam_date ? new Date(ex.exam_date).getDate() : "--"}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-base text-foreground">{ex.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            {ex.exam_date}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Results Card */}
          <Card className="group relative overflow-hidden rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-all duration-300" />
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            <CardHeader className="border-b border-border/50 pb-4 pl-6 pr-6 flex flex-row justify-between items-center bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <BookOpen className="size-5 text-emerald-500" />
                  Recent Results
                </CardTitle>
                <CardDescription className="text-sm">Your latest academic performance</CardDescription>
              </div>
              {(studentData.recent_results?.length ?? 0) > 0 && (
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shadow-sm">
                  {studentData.recent_results?.length} Result{(studentData.recent_results?.length ?? 0) !== 1 ? "s" : ""}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {(studentData.recent_results?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                  <BookOpen className="size-16 opacity-10" />
                  <div>
                    <p className="text-base font-semibold">No results yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Your exam marks will appear here</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {studentData.recent_results?.map((row, i) => (
                    <li
                      key={`${row.exam_title}-${row.subject}-${i}`}
                      className="flex items-center justify-between p-4 sm:px-6 hover:bg-muted/30 transition-colors group/item"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="font-bold text-base text-foreground truncate">{row.exam_title}</p>
                        {row.subject && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                            <Layers className="size-3" />
                            {row.subject}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-black tabular-nums tracking-tight">{row.marks}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Marks</p>
                        </div>
                        {row.grade && (
                          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-black text-sm shadow-sm group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                            {row.grade}
                          </div>
                        )}
                      </div>
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
