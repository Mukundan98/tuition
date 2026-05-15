"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogFormActions } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
const createSchema = z
  .object({
    name: z.string().min(1, "Required"),
    email: z.string().trim().email(),
    username: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
    employee_id: z.string().min(1, "Required"),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    joining_date: z.string().optional(),
    salary: z.string().optional(),
    phone: z.string().optional(),
    /** Present only for server-side validation messages on file upload. */
    photo: z.string().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const editSchema = z
  .object({
    name: z.string().min(1, "Required"),
    email: z.string().trim().email(),
    username: z.string().optional(),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
    employee_id: z.string().min(1, "Required"),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    joining_date: z.string().optional(),
    salary: z.string().optional(),
    phone: z.string().optional(),
    photo: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.password && val.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 8 characters",
        path: ["password"],
      });
    }
    if (val.password && val.password !== val.password_confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["password_confirmation"],
      });
    }
  });

export type TeacherFormValues = z.infer<typeof createSchema>;

function recordToFormData(data: Record<string, unknown>, photo: File | null): FormData {
  const fd = new FormData();
  for (const [k, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;
    fd.append(k, typeof val === "number" ? String(val) : String(val));
  }
  if (photo) fd.append("photo", photo);
  return fd;
}

export function TeacherForm({
  mode,
  teacherId,
  defaultValues,
  existingPhotoUrl,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  teacherId?: number;
  defaultValues?: Partial<TeacherFormValues>;
  existingPhotoUrl?: string | null;
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null);

  const schema = mode === "create" ? createSchema : editSchema;
  const empty: TeacherFormValues = {
    name: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    employee_id: "",
    qualification: "",
    specialization: "",
    joining_date: "",
    salary: "",
    phone: "",
    photo: "",
  };
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(schema) as Resolver<TeacherFormValues>,
    defaultValues: { ...empty, ...defaultValues },
  });

  useEffect(() => {
    if (!defaultValues) return;
    form.reset({
      ...defaultValues,
      password: "",
      password_confirmation: "",
      photo: "",
    } as TeacherFormValues);
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPhotoFile(null);
  }, [teacherId, mode]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function onSubmit(v: Record<string, string | undefined>) {
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    form.clearErrors();
    try {
      const payload: Record<string, unknown> = {
        name: v.name,
        email: v.email,
        username: v.username?.trim() || undefined,
        employee_id: v.employee_id,
        qualification: v.qualification?.trim() || undefined,
        specialization: v.specialization?.trim() || undefined,
        joining_date: v.joining_date?.trim() || undefined,
        salary: v.salary?.trim() ? Number(v.salary) : undefined,
        phone: v.phone?.trim() || undefined,
      };
      if (mode === "create") {
        payload.password = v.password;
        payload.password_confirmation = v.password_confirmation;
      } else {
        if (v.password?.trim()) {
          payload.password = v.password;
          payload.password_confirmation = v.password_confirmation;
        }
      }

      const useMultipart = photoFile != null;
      let r: Awaited<ReturnType<typeof apiFetch<{ teacher: { id: number } }>>>;

      if (useMultipart) {
        const fd = recordToFormData(payload, photoFile);
        const path = mode === "create" ? "teachers" : `teachers/${teacherId}`;
        const method = mode === "create" ? "POST" : "PUT";
        r = await apiFetch<{ teacher: { id: number } }>(path, { method, body: fd });
      } else {
        r =
          mode === "create"
            ? await apiJson<{ teacher: { id: number } }>("teachers", "POST", payload)
            : await apiJson<{ teacher: { id: number } }>(
                `teachers/${teacherId}`,
                "PUT",
                payload
              );
      }

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
      const tid =
        mode === "create" && data && typeof data === "object" && "teacher" in data
          ? (data as { teacher: { id: number } }).teacher.id
          : teacherId;
      if (tid === undefined) {
        setFormError("Could not read teacher id from server response.");
        return;
      }
      if (onSaved) {
        onSaved();
        return;
      }
      router.push(`/teachers/${tid}`);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPending(false);
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;
  const displayName = watch("name");
  const avatarPhotoUrl =
    photoObjectUrl ?? (existingPhotoUrl && existingPhotoUrl.length > 0 ? existingPhotoUrl : null);

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        variant === "dialog"
          ? "flex flex-col space-y-6"
          : "mx-auto max-w-2xl space-y-8 p-6"
      )}
    >
      {variant === "page" && (
        <>
          <Link href="/teachers" className="text-sm text-muted-foreground hover:underline">
            ← Teachers
          </Link>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "Add teacher" : "Edit teacher"}
          </h2>
        </>
      )}

      {apiFieldErrors && <ApiValidationSummary errors={apiFieldErrors} />}

      {formError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center">
        <PersonAvatar
          name={displayName?.trim() || "Teacher"}
          photoUrl={avatarPhotoUrl}
          kind="teacher"
          size={variant === "dialog" ? "md" : "lg"}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="teacher_photo">Profile photo (optional)</Label>
          <Input
            id="teacher_photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cursor-pointer"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Maximum size 2 MB.</p>
          {errors.photo && (
            <p className="text-xs text-destructive">{errors.photo.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username (optional)</Label>
          <Input
            id="username"
            autoComplete="off"
            aria-invalid={!!errors.username}
            {...register("username")}
          />
          <p className="text-xs text-muted-foreground">Sign in with this or email. Letters, numbers, . _ -</p>
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee_id">Employee ID *</Label>
          <Input
            id="employee_id"
            aria-invalid={!!errors.employee_id}
            {...register("employee_id")}
            disabled={mode === "edit"}
          />
          {errors.employee_id && (
            <p className="text-xs text-destructive">{errors.employee_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" aria-invalid={!!errors.phone} {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        {mode === "create" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm password *</Label>
              <Input
                id="password_confirmation"
                type="password"
                aria-invalid={!!errors.password_confirmation}
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>
          </>
        )}
        {mode === "edit" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm new password</Label>
              <Input
                id="password_confirmation"
                type="password"
                aria-invalid={!!errors.password_confirmation}
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
              )}
            </div>
          </>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" aria-invalid={!!errors.qualification} {...register("qualification")} />
          {errors.qualification && (
            <p className="text-xs text-destructive">{errors.qualification.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input id="specialization" aria-invalid={!!errors.specialization} {...register("specialization")} />
          {errors.specialization && (
            <p className="text-xs text-destructive">{errors.specialization.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="joining_date">Joining date</Label>
          <Input id="joining_date" type="date" aria-invalid={!!errors.joining_date} {...register("joining_date")} />
          {errors.joining_date && (
            <p className="text-xs text-destructive">{errors.joining_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" type="number" step="0.01" aria-invalid={!!errors.salary} {...register("salary")} />
          {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
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
          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-indigo-600 to-violet-600"
          >
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
              href="/teachers"
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
