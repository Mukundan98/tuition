"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { StudentOnlineExamListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  Sparkles,
  Brain,
  HelpCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

type Payload = {
  student: { id: number; name: string; admission_number: string };
  items: StudentOnlineExamListItem[];
};

export function StudentOnlineExamsListClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<Payload>("online-exams/for-me");
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];
  const totalExams = items.length;
  const completedExams = items.filter((item) => item.is_submitted).length;
  const pendingExams = items.filter((item) => !item.is_submitted).length;
  const completionRate = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

  const formatExamDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (err) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
        <Card className="border-destructive/30 bg-destructive/5 overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="size-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-destructive">Connection Error</h3>
              <p className="text-sm text-muted-foreground max-w-md">{err}</p>
            </div>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 rounded-xl border-destructive/20 hover:bg-destructive/10 text-destructive font-semibold"
              )}
            >
              <ArrowLeft className="mr-2 size-4" />
              Return to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted/65" />
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="h-44 w-full animate-pulse rounded-[2rem] bg-muted/40" />

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-36 animate-pulse rounded bg-muted/60" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 w-full animate-pulse rounded-2xl bg-muted/20 border" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Premium Header */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Brain className="size-4 text-violet-500 dark:text-violet-400" />
              Student Portal
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Online Exams</h1>
          </div>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </Link>
        </div>

        {/* High-end Glassmorphic Hero Banner */}
        <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-0 right-0 size-48 rounded-full bg-indigo-400/10 blur-3xl" />
          <CardContent className="relative flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-inner">
              <Award className="size-10 text-white" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold">Your Examination Hall</h2>
              <p className="text-indigo-100 max-w-xl text-sm md:text-base leading-relaxed">
                Take active tests and exams configured for your classroom, view automatic grading, and analyze performance records to boost your learning path.
              </p>
            </div>
            <div className="ml-auto hidden xl:block">
              <Sparkles className="size-12 text-indigo-300/40 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Modern Mini-Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Pending Tests",
            value: pendingExams,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/10",
            subtitle: pendingExams === 1 ? "1 active exam" : `${pendingExams} active exams`,
          },
          {
            label: "Completed Tests",
            value: completedExams,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/10",
            subtitle: `Scored in all submissions`,
          },
          {
            label: "Completion Progress",
            value: `${completionRate}%`,
            icon: TrendingUp,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/10",
            subtitle: `Overall exams completed`,
          },
        ].map((item) => (
          <Card
            key={item.label}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {item.label}
              </CardDescription>
              <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                <item.icon className={cn("size-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold tabular-nums tracking-tight">
                {item.value}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{item.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Examination Grid */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Assigned Online Exams</h2>
            <span className="text-xs font-bold bg-violet-500/10 text-violet-600 px-3 py-1 rounded-full border border-violet-500/20">
              Admission: {data.student.admission_number}
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="rounded-[2rem] border-dashed border-2 bg-muted/20 p-12 text-center shadow-inner">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <BookOpen className="size-8 text-muted-foreground/60" />
            </div>
            <CardTitle className="text-lg font-bold">No Active Exams</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2 text-sm leading-relaxed">
              Fantastic job! No published online exams are pending for your class at the moment. Take this time to review past results or study assigned textbooks.
            </CardDescription>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-6 rounded-xl border-border/80 hover:bg-muted font-bold transition-all shadow-sm"
              )}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((row) => (
              <Card
                key={row.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-card/90 shadow-sm transition-all hover:shadow-lg duration-300 hover:border-indigo-500/30",
                  row.is_submitted
                    ? "hover:shadow-emerald-500/[0.02]"
                    : "hover:shadow-indigo-500/[0.04]"
                )}
              >
                {/* Visual Accent bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 w-full h-[3px] transition-all",
                    row.is_submitted
                      ? "bg-emerald-500/80 group-hover:bg-emerald-500"
                      : "bg-indigo-500/80 group-hover:bg-indigo-500 animate-pulse"
                  )}
                />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    {/* Status Badge */}
                    {row.is_submitted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-500/10 px-2.5 py-0.5 rounded-full animate-pulse">
                        <Clock className="size-3" />
                        Ready to Take
                      </span>
                    )}

                    {/* Questions count */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">
                      <HelpCircle className="size-3" />
                      {row.questions_count} Questions
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {row.title}
                  </CardTitle>
                  
                  {row.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-2 leading-relaxed">
                      {row.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 pb-4 border-b border-border/50 text-xs text-muted-foreground">
                    {/* Duration Info */}
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground/70" />
                      <span>Duration: <strong className="font-semibold text-foreground">{row.duration_minutes} Minutes</strong></span>
                    </div>

                    {/* Available Range */}
                    {row.available_until && (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground/70" />
                        <span className="truncate">
                          Until: <strong className="font-semibold text-foreground">{formatExamDate(row.available_until)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score details / Button section */}
                  <div className="pt-4 flex flex-col gap-3">
                    {row.is_submitted && (row.score !== null || row.max_score !== null) && (
                      <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 p-3 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/80 mb-0.5">Your Score</p>
                        <p className="text-lg font-bold text-emerald-600 tabular-nums">
                          {row.score} / {row.max_score}
                          <span className="text-xs text-emerald-600/70 font-medium ml-1.5">
                            ({row.max_score ? Math.round((parseFloat(row.score ?? "0") / parseFloat(row.max_score)) * 100) : 0}%)
                          </span>
                        </p>
                      </div>
                    )}

                    {row.is_submitted ? (
                      <Link
                        href={`/online-exams/${row.id}/result`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full h-10 rounded-xl border-border/80 hover:bg-muted font-bold transition-all shadow-sm"
                        )}
                      >
                        <Activity className="size-4 mr-2" />
                        Performance Analysis
                      </Link>
                    ) : (
                      <Link
                        href={`/online-exams/${row.id}/take`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 font-bold transition-all shadow-md hover:shadow-indigo-500/15 group/btn"
                        )}
                      >
                        Start Exam
                        <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
