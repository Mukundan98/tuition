"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogFormActions } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import type { SchoolClassRow, TeacherRow } from "@/lib/types";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  class_ids: z.array(z.string()).min(1, "Pick at least one class"),
  teacher_id: z.string().optional(),
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required"),
});

type FormVal = z.infer<typeof schema>;

export type SubjectFormDefaults = Partial<FormVal> & {
  /** @deprecated single class — use class_ids */
  class_id?: string;
};

export function SubjectForm({
  mode,
  subjectId,
  defaultValues,
  lockedClassIds,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  subjectId?: number;
  defaultValues?: SubjectFormDefaults;
  /** Classes that must stay selected (create: list filter; edit: this row's `class_id`). */
  lockedClassIds?: number[];
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const lockedKey = [...(lockedClassIds ?? [])].sort((a, b) => a - b).join(",");
  const locked = useMemo(
    () => new Set((lockedClassIds ?? []).filter((id) => Number.isFinite(id) && id > 0)),
    [lockedKey]
  );
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);

  const form = useForm<FormVal>({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      const from =
        defaultValues?.class_ids?.length ? defaultValues.class_ids
        : defaultValues?.class_id ? [defaultValues.class_id]
        : [];
      const withLocked = Array.from(
        new Set([...from.map(String), ...Array.from(locked, String)])
      );
      return {
        class_ids: withLocked,
        teacher_id:
          defaultValues?.teacher_id != null && defaultValues.teacher_id !== ""
            ? String(defaultValues.teacher_id)
            : "",
        name: defaultValues?.name ?? "",
        code: defaultValues?.code ?? "",
      };
    })(),
  });

  useEffect(() => {
    void (async () => {
      const [cr, tr] = await Promise.all([
        apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=200"),
        apiFetch<{ items: TeacherRow[] }>("teachers?per_page=200"),
      ]);
      if (cr.json?.success && cr.json.data?.items) setClasses(cr.json.data.items);
      if (tr.json?.success && tr.json.data?.items) setTeachers(tr.json.data.items);
    })();
  }, []);

  useEffect(() => {
    if (!defaultValues) return;
    const ids =
      defaultValues.class_ids?.length ?
        defaultValues.class_ids
      : defaultValues.class_id ? [defaultValues.class_id]
      : [];
    const merged =
      locked.size > 0
        ? Array.from(new Set([...ids.map(String), ...Array.from(locked, String)]))
        : ids.map(String);
    form.reset({
      class_ids: merged,
      teacher_id:
        defaultValues.teacher_id != null && defaultValues.teacher_id !== ""
          ? String(defaultValues.teacher_id)
          : "",
      name: defaultValues.name ?? "",
      code: defaultValues.code ?? "",
    });
  }, [defaultValues, mode, locked, lockedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { register, control, handleSubmit, formState: { errors }, setError, clearErrors, watch, setValue } = form;

  const selectedIds = watch("class_ids");

  function toggleClass(classId: number) {
    if (locked.has(classId)) return;
    const idStr = String(classId);
    const set = new Set(selectedIds);
    if (set.has(idStr)) set.delete(idStr);
    else set.add(idStr);
    setValue("class_ids", Array.from(set), { shouldValidate: true });
  }

  async function onSubmit(v: FormVal) {
    setPending(true);
    setErr(null);
    setApiFieldErrors(null);
    clearErrors();
    const merged = new Set<number>();
    for (const s of v.class_ids) {
      const n = Number(s);
      if (Number.isFinite(n) && n > 0) merged.add(n);
    }
    locked.forEach((id) => merged.add(id));
    const class_ids = Array.from(merged);
    if (class_ids.length === 0) {
      setPending(false);
      setError("class_ids", { message: "Pick at least one class" });
      return;
    }
    const payload = {
      class_ids,
      teacher_id:
        v.teacher_id && v.teacher_id !== "" ? Number(v.teacher_id) : null,
      name: v.name.trim(),
      code: v.code.trim().toUpperCase(),
    };
    const r =
      mode === "create"
        ? await apiJson("subjects", "POST", payload)
        : await apiJson(`subjects/${subjectId}`, "PUT", payload);
    setPending(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        applyServerErrorsToForm(setError, parsed);
        setApiFieldErrors(parsed);
        return;
      }
      setErr((r.json?.message as string | undefined) ?? "Save failed");
      return;
    }
    if (onSaved) {
      onSaved();
      return;
    }
    router.push("/subjects");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        variant === "dialog" ? "flex flex-col space-y-4" : "mx-auto max-w-xl space-y-6 p-6"
      )}
    >
      {variant === "page" && (
        <>
          <Link href="/subjects" className="text-sm text-muted-foreground hover:underline">
            ← Subjects
          </Link>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New subject" : "Edit subject"}
          </h2>
        </>
      )}
      {apiFieldErrors && <ApiValidationSummary errors={apiFieldErrors} />}

      {err && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Classes *</Label>
          <div
            className="max-h-48 overflow-y-auto rounded-md border border-input bg-background px-3 py-2"
            aria-invalid={!!errors.class_ids}
          >
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading classes…</p>
            ) : (
              <ul className="space-y-2">
                {classes.map((c) => {
                  const idStr = String(c.id);
                  const isLocked = locked.has(c.id);
                  const checked = selectedIds.includes(idStr) || isLocked;
                  return (
                    <li key={c.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 text-sm",
                          isLocked && "cursor-not-allowed opacity-80"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input"
                          checked={checked}
                          disabled={isLocked}
                          onChange={() => toggleClass(c.id)}
                        />
                        <span>
                          {c.name}
                          {c.section ? ` (${c.section})` : ""}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {errors.class_ids && (
            <p className="text-xs text-destructive">{errors.class_ids.message as string}</p>
          )}
          {locked.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {mode === "create"
                ? "Filtered class is fixed; you can add or remove other classes."
                : "This row's class cannot be unchecked; add or remove other classes to copy the subject there."}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Assigned teacher</Label>
          <Controller
            name="teacher_id"
            control={control}
            render={({ field }) => (
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                aria-invalid={!!errors.teacher_id}
                value={field.value ?? ""}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.user?.name ?? t.employee_id}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.teacher_id && (
            <p className="text-xs text-destructive">{errors.teacher_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input aria-invalid={!!errors.code} {...register("code")} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
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
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : (
            <Link
              href="/subjects"
              className={cn(
                buttonVariants({ variant: "outline" }),
                pending && "pointer-events-none opacity-50"
              )}
            >
              Cancel
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
