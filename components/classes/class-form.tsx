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
import { apiFetch, apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import type { TeacherRow } from "@/lib/types";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Required"),
  max_students: z.string().optional(),
  homeroom_teacher_id: z.string().optional(),
});

export type ClassFormSchema = z.infer<typeof schema>;

export function ClassForm({
  mode,
  classId,
  defaultValues,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  classId?: number;
  defaultValues?: Partial<ClassFormSchema>;
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);

  const form = useForm<ClassFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      name: "",
      max_students: "",
      homeroom_teacher_id: "",
    },
  });

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: TeacherRow[] }>("teachers?per_page=200");
      if (r.json?.success && r.json.data?.items) setTeachers(r.json.data.items);
    })();
  }, []);

  useEffect(() => {
    if (!defaultValues) return;
    form.reset({
      name: defaultValues.name ?? "",
      max_students: defaultValues.max_students ?? "",
      homeroom_teacher_id: defaultValues.homeroom_teacher_id ?? "",
    });
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(v: ClassFormSchema) {
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    form.clearErrors();
    try {
      const payload = {
        name: v.name.trim(),
        max_students: v.max_students?.trim()
          ? Number(v.max_students)
          : undefined,
        homeroom_teacher_id:
          v.homeroom_teacher_id && v.homeroom_teacher_id !== ""
            ? Number(v.homeroom_teacher_id)
            : null,
      };

      const r =
        mode === "create"
          ? await apiJson<{ school_class: { id: number } }>("classes", "POST", payload)
          : await apiJson<{ school_class: { id: number } }>(
              `classes/${classId}`,
              "PUT",
              payload
            );

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

      const data = r.json.data;
      let cid: number | undefined;
      if (mode === "create") {
        if (
          data &&
          typeof data === "object" &&
          "school_class" in data &&
          typeof (data as { school_class: { id: number } }).school_class?.id === "number"
        ) {
          cid = (data as { school_class: { id: number } }).school_class.id;
        }
      } else {
        cid = classId;
      }
      if (cid === undefined) {
        setFormError("Could not read class id from server response.");
        return;
      }
      if (onSaved) {
        onSaved();
        return;
      }
      router.push(`/classes/${cid}`);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        variant === "dialog"
          ? "flex flex-col space-y-4"
          : "mx-auto max-w-xl space-y-6 p-6"
      )}
    >
      {variant === "page" && (
        <>
          <Link href="/classes" className="text-sm text-muted-foreground hover:underline">
            ← Classes
          </Link>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New class" : "Edit class"}
          </h2>
        </>
      )}
      {apiFieldErrors && <ApiValidationSummary errors={apiFieldErrors} />}

      {formError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Max students</Label>
          <Input type="number" aria-invalid={!!errors.max_students} {...register("max_students")} />
          {errors.max_students && (
            <p className="text-xs text-destructive">{errors.max_students.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Homeroom teacher</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={!!errors.homeroom_teacher_id}
            {...register("homeroom_teacher_id")}
          >
            <option value="">All</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user?.name ?? t.employee_id} ({t.employee_id})
              </option>
            ))}
          </select>
          {errors.homeroom_teacher_id && (
            <p className="text-xs text-destructive">{errors.homeroom_teacher_id.message}</p>
          )}
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
              href="/classes"
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
