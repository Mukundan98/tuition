"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogFormActions } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import type { ExamRow, SchoolClassRow } from "@/lib/types";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  class_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  exam_date: z.string().min(1, "Required"),
  max_marks: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

export function ExamForm({
  mode,
  examId,
  defaultValues,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  examId?: number;
  defaultValues?: Partial<FormVals & { notes?: string }>;
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      class_id: "",
      title: "",
      exam_date: "",
      max_marks: "100",
      notes: "",
    },
  });

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) setClasses(r.json.data.items);
    })();
  }, []);

  useEffect(() => {
    if (!defaultValues) return;
    form.reset({
      class_id: defaultValues.class_id ?? "",
      title: defaultValues.title ?? "",
      exam_date: defaultValues.exam_date ?? "",
      max_marks: defaultValues.max_marks ?? "100",
      notes: defaultValues.notes ?? "",
    });
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(v: FormVals) {
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    form.clearErrors();
    const payload = {
      class_id: Number(v.class_id),
      title: v.title.trim(),
      exam_date: v.exam_date,
      max_marks: Number(v.max_marks),
      notes: v.notes?.trim() || undefined,
    };
    const r =
      mode === "create"
        ? await apiJson<{ exam: ExamRow }>("exams", "POST", payload)
        : await apiJson<{ exam: ExamRow }>(`exams/${examId}`, "PUT", payload);
    setPending(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        applyServerErrorsToForm(form.setError, parsed);
        setApiFieldErrors(parsed);
        return;
      }
      setFormError((r.json?.message as string | undefined) ?? "Save failed");
      return;
    }
    const id = mode === "create" ? r.json.data?.exam?.id : examId;
    if (onSaved) {
      onSaved();
      return;
    }
    router.push(`/exams/${id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        variant === "dialog" ? "flex flex-col space-y-4" : "mx-auto max-w-lg space-y-6 p-6"
      )}
    >
      {variant === "page" && (
        <>
          <Link href="/exams" className="text-sm text-muted-foreground hover:underline">
            ← Exams
          </Link>
          <h2 className="text-xl font-semibold">{mode === "create" ? "New exam" : "Edit exam"}</h2>
        </>
      )}
      {apiFieldErrors && <ApiValidationSummary errors={apiFieldErrors} />}

      {formError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="class_id">Class *</Label>
        <select
          id="class_id"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          disabled={mode === "edit"}
          aria-invalid={!!form.formState.errors.class_id}
          {...form.register("class_id")}
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.section ? ` (${c.section})` : ""}
            </option>
          ))}
        </select>
        {form.formState.errors.class_id && (
          <p className="text-xs text-destructive">{form.formState.errors.class_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" aria-invalid={!!form.formState.errors.title} {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="exam_date">Exam date *</Label>
        <Input
          id="exam_date"
          type="date"
          aria-invalid={!!form.formState.errors.exam_date}
          {...form.register("exam_date")}
        />
        {form.formState.errors.exam_date && (
          <p className="text-xs text-destructive">{form.formState.errors.exam_date.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="max_marks">Max marks (per subject) *</Label>
        <Input
          id="max_marks"
          type="number"
          step="0.01"
          min="1"
          aria-invalid={!!form.formState.errors.max_marks}
          {...form.register("max_marks")}
        />
        {form.formState.errors.max_marks && (
          <p className="text-xs text-destructive">{form.formState.errors.max_marks.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          aria-invalid={!!form.formState.errors.notes}
          {...form.register("notes")}
        />
        {form.formState.errors.notes && (
          <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      {variant === "dialog" ? (
        <DialogFormActions>
          {onCancel && (
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="min-w-[7rem] bg-gradient-to-r from-indigo-600 to-violet-600"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFormActions>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending} className="bg-gradient-to-r from-indigo-600 to-violet-600">
            {pending ? "Saving…" : "Save"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : (
            <Link href="/exams" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
