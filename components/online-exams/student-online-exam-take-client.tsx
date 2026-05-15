"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";

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
    description: string | null;
    duration_minutes: number;
  };
  questions: TakeQuestion[];
  attempt: { submitted_at: string | null; score: string | null; max_score: string | null } | null;
};

export function StudentOnlineExamTakeClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TakePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<TakePayload>(`online-exams/${examId}/take`);
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

  async function submit() {
    if (!data) return;
    setSubmitErr(null);
    const ans: Record<string, number> = {};
    for (const q of data.questions) {
      if (answers[q.id] === undefined) {
        setSubmitErr("Answer every question before submitting.");
        return;
      }
      ans[String(q.id)] = answers[q.id];
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
  }

  if (err) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <p className="text-destructive">{err}</p>
        <Link href="/online-exams" className="text-sm text-muted-foreground hover:underline">
          ← Online exams
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{data.exam.title}</h2>
          {data.exam.description && (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{data.exam.description}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Suggested time: {data.exam.duration_minutes} min · {data.questions.length} questions
          </p>
        </div>
        <Link href="/online-exams" className="text-sm text-muted-foreground hover:underline shrink-0">
          ← Back
        </Link>
      </div>

      {submitErr && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitErr}
        </p>
      )}

      <div className="space-y-8">
        {data.questions.map((q, idx) => (
          <fieldset key={q.id} className="space-y-3 rounded-lg border p-4">
            <legend className="text-sm font-medium">
              Question {idx + 1}
            </legend>
            <p className="text-sm whitespace-pre-wrap">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="radio"
                    className="mt-1"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          className="bg-gradient-to-r from-indigo-600 to-violet-600"
          onClick={() => void submit()}
        >
          {pending ? "Submitting…" : "Submit answers"}
        </Button>
      </div>
    </div>
  );
}
