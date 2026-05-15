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
import type { StudentRow } from "@/lib/types";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const createSchema = z.object({
  student_id: z.string().min(1, "Pick a student"),
  title: z.string().min(1, "Required"),
  notes: z.string().optional(),
  amount: z.string().min(1, "Required"),
  due_date: z.string().min(1, "Required"),
});

const editSchema = z.object({
  title: z.string().min(1, "Required"),
  notes: z.string().optional(),
  amount: z.string().min(1, "Required"),
  due_date: z.string().min(1, "Required"),
});

type CreateVals = z.infer<typeof createSchema>;
type EditVals = z.infer<typeof editSchema>;

export function FeeForm({
  mode,
  feeId,
  defaultEdit,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  feeId?: number;
  defaultEdit?: Partial<EditVals>;
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);

  const editForm = useForm<EditVals>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      notes: "",
      amount: "",
      due_date: "",
    },
  });

  const createForm = useForm<CreateVals>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      student_id: "",
      title: "",
      notes: "",
      amount: "",
      due_date: "",
    },
  });

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: StudentRow[] }>("students?per_page=200");
      if (r.json?.success && r.json.data?.items) {
        setStudents(r.json.data.items);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !defaultEdit) return;
    editForm.reset({
      title: defaultEdit.title ?? "",
      notes: defaultEdit.notes ?? "",
      amount: defaultEdit.amount ?? "",
      due_date: defaultEdit.due_date ?? "",
    });
  }, [defaultEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(v: CreateVals) {
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    createForm.clearErrors();
    const r = await apiJson<{ fee: { id: number } }>("fees", "POST", {
      student_id: Number(v.student_id),
      title: v.title.trim(),
      notes: v.notes?.trim() || undefined,
      amount: Number(v.amount),
      due_date: v.due_date,
    });
    setPending(false);
    if (!r.ok || !r.json?.success || !r.json.data?.fee) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        applyServerErrorsToForm(createForm.setError, parsed);
        setApiFieldErrors(parsed);
        return;
      }
      setFormError((r.json?.message as string | undefined) ?? "Save failed");
      return;
    }
    if (onSaved) {
      onSaved();
      return;
    }
    router.push(`/fees/${r.json.data.fee.id}`);
    router.refresh();
  }

  async function onEdit(v: EditVals) {
    if (!feeId) return;
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    editForm.clearErrors();
    const r = await apiJson<{ fee: { id: number } }>(`fees/${feeId}`, "PUT", {
      title: v.title.trim(),
      notes: v.notes?.trim() || undefined,
      amount: Number(v.amount),
      due_date: v.due_date,
    });
    setPending(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        applyServerErrorsToForm(editForm.setError, parsed);
        setApiFieldErrors(parsed);
        return;
      }
      setFormError((r.json?.message as string | undefined) ?? "Save failed");
      return;
    }
    if (onSaved) {
      onSaved();
      return;
    }
    router.push(`/fees/${feeId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={
        mode === "create"
          ? createForm.handleSubmit(onCreate)
          : editForm.handleSubmit(onEdit)
      }
      className={cn(
        variant === "dialog" ? "flex flex-col space-y-4" : "mx-auto max-w-lg space-y-6 p-6"
      )}
    >
      {variant === "page" && (
        <>
          <Link href="/fees/report" className="text-sm text-muted-foreground hover:underline">
            ← Fees report
          </Link>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New fee" : "Edit fee"}
          </h2>
        </>
      )}
      {apiFieldErrors && <ApiValidationSummary errors={apiFieldErrors} />}

      {formError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="student_id">Student *</Label>
          <select
            id="student_id"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            aria-invalid={!!createForm.formState.errors.student_id}
            {...createForm.register("student_id")}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.admission_number}
              </option>
            ))}
          </select>
          {createForm.formState.errors.student_id && (
            <p className="text-xs text-destructive">
              {createForm.formState.errors.student_id.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          aria-invalid={
            !!(mode === "create"
              ? createForm.formState.errors.title
              : editForm.formState.errors.title)
          }
          {...(mode === "create" ? createForm.register("title") : editForm.register("title"))}
        />
        {(mode === "create" ? createForm.formState.errors.title : editForm.formState.errors.title) && (
          <p className="text-xs text-destructive">
            {(mode === "create" ? createForm.formState.errors.title : editForm.formState.errors.title)
              ?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          aria-invalid={
            !!(mode === "create"
              ? createForm.formState.errors.amount
              : editForm.formState.errors.amount)
          }
          {...(mode === "create" ? createForm.register("amount") : editForm.register("amount"))}
        />
        {(mode === "create" ? createForm.formState.errors.amount : editForm.formState.errors.amount) && (
          <p className="text-xs text-destructive">
            {(mode === "create"
              ? createForm.formState.errors.amount
              : editForm.formState.errors.amount
            )?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_date">Due date *</Label>
        <Input
          id="due_date"
          type="date"
          aria-invalid={
            !!(mode === "create"
              ? createForm.formState.errors.due_date
              : editForm.formState.errors.due_date)
          }
          {...(mode === "create" ? createForm.register("due_date") : editForm.register("due_date"))}
        />
        {(mode === "create"
          ? createForm.formState.errors.due_date
          : editForm.formState.errors.due_date) && (
          <p className="text-xs text-destructive">
            {(mode === "create"
              ? createForm.formState.errors.due_date
              : editForm.formState.errors.due_date
            )?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          aria-invalid={
            !!(mode === "create"
              ? createForm.formState.errors.notes
              : editForm.formState.errors.notes)
          }
          {...(mode === "create" ? createForm.register("notes") : editForm.register("notes"))}
        />
        {(mode === "create" ? createForm.formState.errors.notes : editForm.formState.errors.notes) && (
          <p className="text-xs text-destructive">
            {(mode === "create"
              ? createForm.formState.errors.notes
              : editForm.formState.errors.notes
            )?.message}
          </p>
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
          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-indigo-600 to-violet-600"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
              Cancel
            </Button>
          ) : (
            <Link href="/fees/report" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
