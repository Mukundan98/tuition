"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  FileText
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

type TakeQuestion = {
  id: number;
  sort_order: number;
  prompt: string;
  options: string[];
};

type TakePayload = {
  exam: {
    id: number;
    title: string;
    type: string;
    description: string | null;
    duration_minutes: number;
  };
  questions: TakeQuestion[];
  attempt: {
    started_at?: string | null;
    submitted_at: string | null;
    score: string | null;
    max_score: string | null;
  } | null;
};

export function StudentOnlineExamTakeClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TakePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const spokenWarns = useRef<Record<string, boolean>>({});

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const submit = useCallback(async (force = false) => {
    if (!data) return;
    setSubmitErr(null);
    const ans: Record<string, number | string> = {};
    for (const q of data.questions) {
      const val = answers[q.id];
      if (!force) {
        if (val === undefined || (typeof val === "string" && !val.trim())) {
          setSubmitErr("Please answer all questions before submitting your examination.");
          return;
        }
      }
      ans[String(q.id)] = val !== undefined ? (typeof val === "string" ? val.trim() : val) : "";
    }
    setPending(true);
    const r = await apiJson<{ attempt: { score: string; max_score: string; percentage: number | null } }>(
      `online-exams/${examId}/submit`,
      "POST",
      { answers: ans }
    );
    setPending(false);
    if (!r.ok || !r.json?.success) {
      setSubmitErr(firstError(r.json?.errors) ?? r.json?.message ?? "Submit failed.");
      return;
    }
    router.push(`/online-exams/${examId}/result`);
    router.refresh();
  }, [data, answers, examId, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch<TakePayload>(`online-exams/${examId}/take`);
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load this exam.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
    if (r.json.data.attempt?.submitted_at) {
      router.replace(`/online-exams/${examId}/result`);
    }
  }, [examId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!data) return;

    const durationSeconds = data.exam.duration_minutes * 60;
    const startedAtMs = data.attempt?.started_at ? new Date(data.attempt.started_at).getTime() : Date.now();

    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      return Math.max(0, durationSeconds - elapsed);
    };

    const initialRemaining = calculateRemaining();
    setSecondsLeft(initialRemaining);

    // Initial voice greeting
    if (!spokenWarns.current["welcome"]) {
      spokenWarns.current["welcome"] = true;
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      if (elapsed < 10) {
        speak(`Exam started. You have ${data.exam.duration_minutes} minutes.`);
      } else {
        const minutesRemaining = Math.max(1, Math.round(initialRemaining / 60));
        speak(`Welcome back. You have ${minutesRemaining} minutes remaining.`);
      }
    }

    // Initialize spoken warnings to avoid repeating passed milestones
    if (initialRemaining <= 1800) spokenWarns.current["30"] = true;
    if (initialRemaining <= 600) spokenWarns.current["10"] = true;
    if (initialRemaining <= 300) spokenWarns.current["5"] = true;
    if (initialRemaining <= 60) spokenWarns.current["1"] = true;

    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setSecondsLeft(rem);

      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data, speak]);

  // Voice warnings trigger
  useEffect(() => {
    if (secondsLeft === null || !data) return;

    if (secondsLeft <= 0) {
      if (!spokenWarns.current["expired"]) {
        spokenWarns.current["expired"] = true;
        speak("Time is up! Submitting your exam automatically.");
        void submit(true);
      }
      return;
    }

    if (secondsLeft <= 1800 && secondsLeft > 600 && !spokenWarns.current["30"]) {
      spokenWarns.current["30"] = true;
      speak("Attention: You have 30 minutes remaining for this exam.");
    } else if (secondsLeft <= 600 && secondsLeft > 300 && !spokenWarns.current["10"]) {
      spokenWarns.current["10"] = true;
      speak("Attention: You have just 10 minutes remaining for this exam.");
    } else if (secondsLeft <= 300 && secondsLeft > 60 && !spokenWarns.current["5"]) {
      spokenWarns.current["5"] = true;
      speak("Warning: You have only 5 minutes remaining.");
    } else if (secondsLeft <= 60 && secondsLeft > 0 && !spokenWarns.current["1"]) {
      spokenWarns.current["1"] = true;
      speak("Warning: You have only 1 minute remaining.");
    }
  }, [secondsLeft, data, submit, speak]);

  const getTimerColorClasses = useCallback(() => {
    if (secondsLeft === null) return "text-muted-foreground bg-secondary/10 border-border/50";
    if (secondsLeft > 1800) {
      // Green
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    } else if (secondsLeft > 600) {
      // Orange
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    } else {
      // Red
      return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse font-bold";
    }
  }, [secondsLeft]);

  const formatTime = useCallback((secs: number | null) => {
    if (secs === null) return "--:--";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const pad = (n: number) => String(n).padStart(2, "0");
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }, []);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data?.questions.length ?? 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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
              <h3 className="text-lg font-bold text-destructive">Unable to Access Exam</h3>
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
        <div className="h-32 w-full animate-pulse rounded-2xl bg-muted/20 border" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-2xl bg-muted/25 border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-8 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Floating Sticky Timer */}
      {secondsLeft !== null && (
        <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className={cn(
            "pointer-events-auto flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300",
            getTimerColorClasses()
          )}>
            <Clock className={cn("size-5", secondsLeft <= 600 ? "animate-spin" : "")} style={{ animationDuration: secondsLeft <= 600 ? "3s" : undefined }} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider opacity-85 font-semibold">Time Remaining</span>
              <span className="text-lg font-mono font-bold tracking-tight">{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <Brain className="size-4 text-indigo-500" />
              Examination Hall
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{data.exam.title}</h1>
          </div>
          <Link
            href="/online-exams"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Exit Exam
          </Link>
        </div>

        {/* Dynamic Instruction & Info Bar */}
        <Card className="relative overflow-hidden rounded-2xl border bg-card/90 shadow-sm backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="size-4 text-indigo-500" />
                  Examination Instructions
                </h3>
                {data.exam.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {data.exam.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Answer all multiple-choice questions below. Make sure to double-check your options before submitting.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap md:flex-col gap-3 md:text-right shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-border/50">
                <div className={cn(
                  "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors duration-300",
                  getTimerColorClasses()
                )}>
                  <Clock className="size-4 shrink-0" />
                  <span>Time Remaining: {formatTime(secondsLeft)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold justify-end px-3">
                  <HelpCircle className="size-4 text-indigo-500" />
                  <span>Total Questions: {totalQuestions} Items</span>
                </div>
              </div>
            </div>

            {/* Premium Sticky Progress Bar */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                <span>PROGRESS</span>
                <span>{answeredCount} of {totalQuestions} answered ({progressPercent}%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {submitErr && (
        <Card className="border-destructive/30 bg-destructive/5 rounded-xl shadow-md overflow-hidden animate-in shake duration-300">
          <CardContent className="p-4 flex items-center gap-3 text-destructive">
            <AlertTriangle className="size-5 shrink-0" />
            <p className="text-sm font-semibold">{submitErr}</p>
          </CardContent>
        </Card>
      )}

      {/* Questions Stack */}
      <div className="space-y-6">
        {data.questions.map((q, idx) => {
          const val = answers[q.id];
          const isAnswered = data.exam.type === "mcq"
            ? val !== undefined
            : typeof val === "string" && val.trim() !== "";

          return (
            <Card 
              key={q.id} 
              className={cn(
                "rounded-[1.5rem] border bg-card/90 shadow-sm transition-all duration-300",
                isAnswered ? "border-indigo-500/30 shadow-indigo-500/[0.01]" : "border-border/60"
              )}
            >
              <CardHeader className="p-6 pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className={cn(
                    "inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full",
                    isAnswered 
                      ? "text-emerald-600 bg-emerald-500/10" 
                      : "text-indigo-600 bg-indigo-500/10"
                  )}>
                    Question {idx + 1}
                  </span>
                  <CardTitle className="text-base font-bold leading-relaxed pt-2 whitespace-pre-wrap">
                    {q.prompt}
                  </CardTitle>
                </div>
                {isAnswered && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 p-1 text-emerald-600">
                    <CheckCircle className="size-4" />
                  </span>
                )}
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-3">
                {data.exam.type === "mcq" ? (
                  <div className="grid gap-3">
                    {q.options.map((opt, i) => {
                      const isSelected = answers[q.id] === i;
                      return (
                        <label 
                          key={i} 
                          className={cn(
                            "group flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:bg-muted/40",
                            isSelected 
                              ? "border-indigo-500 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04]" 
                              : "border-border/60 hover:border-border"
                          )}
                        >
                          <div className="relative flex items-center justify-center">
                            <input
                              type="radio"
                              className="sr-only"
                              name={`q-${q.id}`}
                              checked={isSelected}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                            />
                            <div className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected 
                                ? "border-indigo-500 bg-indigo-500 text-white scale-110" 
                                : "border-muted-foreground/40"
                            )}>
                              {isSelected && <div className="size-2 rounded-full bg-white" />}
                            </div>
                          </div>
                          <span className={cn(
                            "text-sm transition-colors",
                            isSelected ? "font-bold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : data.exam.type === "single_word" ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">YOUR ANSWER</Label>
                    <Input
                      className="max-w-md h-12 rounded-xl text-base px-4 border-2 focus-visible:ring-indigo-500"
                      placeholder="Type your single-word answer..."
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">YOUR ANSWER (LONG TEXT)</Label>
                    <Textarea
                      className="min-h-[8rem] rounded-xl text-base p-4 border-2 focus-visible:ring-indigo-500"
                      placeholder="Type your essay/long answer here..."
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submission Card */}
      <Card className="rounded-[1.5rem] border bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-indigo-950/20 overflow-hidden shadow-md">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-base">Ready to submit?</h3>
            <p className="text-xs text-muted-foreground">
              Please verify that you have answered all questions. You cannot change your choices once submitted.
            </p>
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void submit()}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold transition-all shadow-lg hover:opacity-95 active:scale-95 shrink-0"
          >
            {pending ? "Submitting answers..." : "Finish and Submit"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
