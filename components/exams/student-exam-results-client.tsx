"use client";

import {
  GraduationCap,
  Award,
  BarChart3,
  CheckCircle2,
  Target,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StudentExamPerformanceBlock } from "@/lib/types";

type Payload = {
  student: { id: number; name: string; admission_number: string };
  exams: StudentExamPerformanceBlock[];
};

export function StudentExamResultsClient({
  studentId,
  variant,
}: {
  studentId: number;
  variant: "student" | "admin";
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<Payload>(`students/${studentId}/exam-performance`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const profileHref = `/students/${studentId}`;

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        {variant === "admin" ? (
          <Link href={profileHref} className="text-sm text-muted-foreground hover:underline">
            ← Profile
          </Link>
        ) : (
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Dashboard
          </Link>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 p-8 animate-pulse">
        <header className="flex flex-col gap-6">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-40 w-full bg-muted rounded-[2rem]" />
        </header>
        <section className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </section>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate global summary stats
  const totalExams = data.exams.length;
  const overallAverage = totalExams > 0
    ? (data.exams.reduce((acc, curr) => acc + Number(curr.average_percentage || 0), 0) / totalExams).toFixed(1)
    : "0";
  const bestExam = totalExams > 0
    ? [...data.exams].sort((a, b) => Number(b.average_percentage) - Number(a.average_percentage))[0]
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              <GraduationCap className="size-4 text-indigo-500" />
              {variant === "student" ? "Academic Portal" : `Record — ${data.student.name}`}
            </div>
            <h1 className="text-3xl font-black tracking-tight">Exam Performance</h1>
          </div>
          <Link
            href={variant === "admin" ? profileHref : "/dashboard"}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border/60 bg-background/50 px-4 text-xs font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider"
          >
            {variant === "admin" ? "← Profile" : "← Dashboard"}
          </Link>
        </div>

        <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
          <CardContent className="relative flex flex-col md:flex-row items-center gap-8 p-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <Award className="size-10 text-white" />
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <h2 className="text-2xl font-bold">Success Starts with Insights</h2>
              <p className="text-indigo-100 mt-1 max-w-xl text-sm leading-relaxed opacity-90">
                Track your progress, analyze subject-wise strength, and view comprehensive feedback on your academic journey. Admission ID: <span className="font-bold text-white">{data.student.admission_number}</span>.
              </p>
            </div>
            <div className="hidden lg:block border-l border-white/10 pl-8">
              <div className="space-y-1 text-right">
                <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Overall Average</p>
                <div className="flex items-center justify-end gap-2 text-white">
                  <span className="text-4xl font-black">{overallAverage}%</span>
                  <TrendingUp className="size-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Exams", value: totalExams, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Aggregate Performance", value: `${overallAverage}%`, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Best Achievement", value: bestExam ? `${bestExam.average_percentage}%` : "—", icon: Target, subtitle: bestExam?.exam.title, color: "text-purple-600", bg: "bg-purple-500/10" },
        ].map((item) => (
          <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/85 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                {item.label}
              </CardDescription>
              <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                <item.icon className={cn("size-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight text-foreground/90">
                {item.value}
              </div>
              {'subtitle' in item && item.subtitle && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate font-medium">
                  {item.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Info className="size-5 text-indigo-500" />
            Performance Breakdown
          </h2>
        </div>

        {data.exams.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 bg-muted/20 p-16 text-center">
            <Award className="mx-auto size-14 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">No Results Released</CardTitle>
            <CardDescription className="max-w-xs mx-auto mt-2">
              You haven&apos;t participated in any exams yet, or your results are still being processed by the administration.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-8">
            {data.exams.map((block) => (
              <Card
                key={block.exam.id}
                className="overflow-hidden rounded-[1.5rem] border-border/60 bg-card shadow-lg ring-1 ring-black/5"
              >
                <div className="p-6 md:p-8 bg-gradient-to-r from-muted/30 to-transparent border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider w-fit">
                        <Calendar className="size-3" />
                        {block.exam.exam_date}
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-foreground">{block.exam.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                          <LayoutDashboard className="size-3.5" />
                          {block.exam.class?.name ?? "General"}
                          {block.exam.class?.section ? ` (${block.exam.class.section})` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm p-4 rounded-2xl ring-1 ring-border/50 shadow-inner">
                      <div className="text-right border-r pr-4 border-border/60">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Aggregate</p>
                        <p className="text-xl font-black text-foreground">
                          {block.average_marks}<span className="text-xs text-muted-foreground ml-1">/ {block.exam.max_marks}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Grade</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {block.average_grade ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Subject</TableHead>
                        <TableHead className="text-right tabular-nums font-bold text-[10px] uppercase tracking-widest">Maximum Marks</TableHead>
                        <TableHead className="text-right tabular-nums font-bold text-[10px] uppercase tracking-widest">Marks Obtained</TableHead>
                        <TableHead className="px-8 font-bold text-[10px] uppercase tracking-widest">Grade & Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="px-8 py-12 text-center text-muted-foreground font-medium italic">
                            No subject lines recorded for this examination.
                          </TableCell>
                        </TableRow>
                      ) : (
                        block.lines.map((line) => (
                          <TableRow key={`${block.exam.id}-${line.subject_id}`} className="group hover:bg-muted/5 transition-colors">
                            <TableCell className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground/90 group-hover:text-indigo-600 transition-colors">
                                  {line.subject_name ?? "—"}
                                </span>
                                {line.subject_code && (
                                  <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-tighter opacity-60">
                                    <BookOpen className="size-2.5" />
                                    {line.subject_code}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground font-medium">
                              {line.max_marks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-bold text-lg text-foreground/80">
                              {line.marks_obtained}
                            </TableCell>
                            <TableCell className="px-8 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex size-9 items-center justify-center rounded-xl font-black text-sm shadow-sm ring-1 ring-inset",
                                  line.marks_obtained >= (line.max_marks * 0.75) ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
                                    line.marks_obtained >= (line.max_marks * 0.45) ? "bg-amber-500/10 text-amber-600 ring-amber-500/20" :
                                      "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                                )}>
                                  {line.grade ?? "—"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-muted-foreground italic truncate">
                                    {line.remarks && line.remarks !== '—' ? `"${line.remarks}"` : "Satisfactory performance."}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
