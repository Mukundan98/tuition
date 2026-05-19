"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Calendar,
  HelpCircle,
  Award,
  Sparkles,
  AlertTriangle
} from "lucide-react";

type Line = {
  question_id: number;
  prompt: string;
  options: string[];
  chosen_index: number | null;
  chosen_text: string | null;
  correct_index: number | null;
  correct_text: string | null;
  is_correct: boolean;
  points: string;
  earned: string;
};

type ResultPayload = {
  exam: { id: number; title: string; type: string };
  attempt: {
    score: string | null;
    max_score: string | null;
    percentage: number | null;
    submitted_at: string;
  };
  lines: Line[];
};

export function StudentOnlineExamResultClient({ examId }: { examId: string }) {
  const [data, setData] = useState<ResultPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<ResultPayload>(`online-exams/${examId}/my-result`);
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "No result found for this exam yet.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const scorePercent = data?.attempt.percentage ?? 0;
  const totalCorrect = data?.lines.filter((l) => l.is_correct).length ?? 0;
  const totalQuestions = data?.lines.length ?? 0;

  if (err) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
        <Card className="border-destructive/30 bg-destructive/5 overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="size-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-destructive">Result Not Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">{err}</p>
            </div>
            <Link
              href="/online-exams"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 rounded-xl border-destructive/20 hover:bg-destructive/10 text-destructive font-semibold"
              )}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Exams list
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-muted/65" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="h-44 w-full animate-pulse rounded-[2rem] bg-muted/20 border" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 w-full animate-pulse rounded-2xl bg-muted/25 border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Header bar */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Award className="size-4 text-emerald-500" />
              Grading & Feedback
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Summary</h1>
          </div>
          <Link
            href="/online-exams"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Exams
          </Link>
        </div>

        {/* High-end Gradient Score Banner */}
        <Card className={cn(
          "relative overflow-hidden rounded-[2rem] border-0 text-white shadow-2xl transition-all duration-500",
          scorePercent >= 75
            ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800"
            : scorePercent >= 40
              ? "bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800"
              : "bg-gradient-to-br from-violet-700 via-rose-700 to-red-800"
        )}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-3xl" />
          
          <CardContent className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-inner">
                <Trophy className="size-10 text-white animate-bounce" />
              </div>
              <div className="space-y-1.5 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Exam completed</p>
                <h2 className="text-xl md:text-2xl font-bold line-clamp-1">{data.exam.title}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-indigo-100/90 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(data.attempt.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Ring Display */}
            <div className="flex flex-col items-center bg-white/10 ring-1 ring-white/20 backdrop-blur-md rounded-2xl px-6 py-4 text-center shrink-0 min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">GRADE SCORE</span>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums mt-1">
                {scorePercent}%
              </span>
              <span className="text-xs text-indigo-100 font-semibold mt-0.5">
                {data.attempt.score} / {data.attempt.max_score} pts
              </span>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Stats Summary Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Correct answers",
            value: `${totalCorrect} / ${totalQuestions}`,
            subtitle: `${totalQuestions - totalCorrect} incorrect choices`,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Total Score Points",
            value: `${parseFloat(data.attempt.score ?? "0")} / ${parseFloat(data.attempt.max_score ?? "0")}`,
            subtitle: "Weighted grading standard",
            icon: Award,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Performance Level",
            value: scorePercent >= 75 ? "Excellent" : scorePercent >= 50 ? "Satisfactory" : "Needs Review",
            subtitle: "Based on overall threshold",
            icon: Sparkles,
            color: scorePercent >= 75 ? "text-amber-500" : "text-violet-500",
            bg: scorePercent >= 75 ? "bg-amber-500/10" : "bg-violet-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border bg-card/85 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {stat.label}
              </CardDescription>
              <div className={cn("rounded-lg p-2", stat.bg)}>
                <stat.icon className={cn("size-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Answer Key Details */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="size-5 text-indigo-500" />
          Question Breakdown & Review
        </h2>

        <div className="space-y-6">
          {data.lines.map((line, i) => (
            <Card 
              key={line.question_id}
              className={cn(
                "rounded-2xl border bg-card/90 shadow-sm overflow-hidden",
                line.is_correct ? "border-emerald-500/20" : "border-rose-500/20"
              )}
            >
              {/* Colored Side Bar Accent */}
              <div className={cn(
                "absolute top-0 left-0 w-[4px] h-full",
                line.is_correct ? "bg-emerald-500/70" : "bg-rose-500/70"
              )} />

              <CardHeader className="p-6 pb-3 flex flex-row items-start justify-between gap-4 pl-7">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                      Question {i + 1}
                    </span>
                    {line.is_correct ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        <XCircle className="size-3" />
                        Incorrect
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-semibold leading-relaxed pt-2 whitespace-pre-wrap">
                    {line.prompt}
                  </CardTitle>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-muted-foreground/80 tabular-nums">
                    {line.earned} / {line.points} pts
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-3 pl-7">
                {data.exam.type === "mcq" ? (
                  <div className="grid gap-2.5">
                    {line.options.map((opt, optionIdx) => {
                      const isChosen = line.chosen_index === optionIdx;
                      const isCorrectOption = line.correct_index === optionIdx;

                      return (
                        <div
                          key={optionIdx}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border text-sm transition-all",
                            isCorrectOption
                              ? "border-emerald-500/40 bg-emerald-500/[0.03] text-emerald-950 dark:text-emerald-300 font-medium"
                              : isChosen && !line.is_correct
                                ? "border-rose-500/40 bg-rose-500/[0.03] text-rose-950 dark:text-rose-300"
                                : "border-border/60 bg-muted/10 text-muted-foreground"
                          )}
                        >
                          {/* Option Marker Icon */}
                          <div className="shrink-0 flex items-center justify-center">
                            {isCorrectOption ? (
                              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                            ) : isChosen && !line.is_correct ? (
                              <XCircle className="size-4.5 text-rose-600 shrink-0" />
                            ) : (
                              <div className="size-4.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            )}
                          </div>
                          
                          <span className="flex-1 leading-snug">{opt}</span>

                          {/* Label Badge */}
                          {isCorrectOption && (
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                              Correct Answer
                            </span>
                          )}
                          {isChosen && !isCorrectOption && (
                            <span className="text-[9px] uppercase font-bold tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">
                              Your Choice
                            </span>
                          )}
                          {isChosen && isCorrectOption && (
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                              Your Choice (Correct)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : data.exam.type === "single_word" ? (
                  <div className="space-y-3">
                    <div className={cn(
                      "p-4 rounded-xl border flex flex-col gap-1.5 text-sm",
                      line.is_correct
                        ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                        : "border-rose-500/40 bg-rose-500/[0.03]"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Your Answer</span>
                        {line.is_correct ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Correct</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">Incorrect</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-base font-bold",
                        line.is_correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                      )}>
                        {line.chosen_text || "—"}
                      </p>
                    </div>
                    {!line.is_correct && (
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col gap-1.5 text-sm">
                        <span className="font-semibold text-xs text-emerald-600 uppercase tracking-wider">Correct Answer</span>
                        <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{line.correct_text}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-1.5 text-sm">
                      <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Submitted Answer</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {line.chosen_text || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-dashed border-amber-500/35 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-medium">
                      Note: Essay / Long answer questions are reviewed manually by your teacher and are not automatically graded.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
