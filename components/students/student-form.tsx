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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { SchoolClassRow } from "@/lib/types";
import { applyServerErrorsToForm, parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const selectFieldClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const studentCreateSchema = z
  .object({
    name: z.string().min(1, "Required"),
    email: z.string().trim().min(1, "Required").email("Invalid email"),
    username: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
    admission_number: z.string().min(1, "Required"),
    class_id: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    blood_group: z.string().optional(),
    parent_name: z.string().optional(),
    parent_phone: z.string().optional(),
    parent_email: z.union([z.literal(""), z.string().trim().email("Invalid")]),
    parent_occupation: z.string().optional(),
    photo: z.string().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const studentEditSchema = z
  .object({
    name: z.string().min(1, "Required"),
    email: z.union([z.literal(""), z.string().trim().email("Invalid email")]),
    username: z.string().optional(),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
    admission_number: z.string().min(1, "Required"),
    class_id: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    blood_group: z.string().optional(),
    parent_name: z.string().optional(),
    parent_phone: z.string().optional(),
    parent_email: z.union([z.literal(""), z.string().trim().email("Invalid")]),
    parent_occupation: z.string().optional(),
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

export type StudentFormSchema = z.infer<typeof studentEditSchema>;

function toProfilePayload(v: StudentFormSchema) {
  return {
    name: v.name.trim(),
    email: v.email.trim() ? v.email.trim() : undefined,
    admission_number: v.admission_number.trim(),
    class_id: v.class_id && v.class_id !== "" ? Number(v.class_id) : null,
    date_of_birth: v.date_of_birth?.trim() || undefined,
    gender: v.gender?.trim() || undefined,
    address: v.address?.trim() || undefined,
    blood_group: v.blood_group?.trim() || undefined,
    parent_name: v.parent_name?.trim() || undefined,
    parent_phone: v.parent_phone?.trim() || undefined,
    parent_email: v.parent_email?.trim() ? v.parent_email.trim() : undefined,
    parent_occupation: v.parent_occupation?.trim() || undefined,
  };
}

function toFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    fd.append(k, typeof v === "number" ? String(v) : String(v));
  }
  return fd;
}

export function StudentForm({
  mode,
  studentId,
  defaultValues,
  portalUserId = null,
  existingPhotoUrl,
  variant = "page",
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  studentId?: number;
  defaultValues?: Partial<StudentFormSchema>;
  /** Set when the student has a linked portal `users` row (editing only). */
  portalUserId?: number | null;
  /** Current profile image when editing (for preview until a new file is chosen). */
  existingPhotoUrl?: string | null;
  variant?: "page" | "dialog";
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null);

  const schema = mode === "create" ? studentCreateSchema : studentEditSchema;

  const form = useForm<StudentFormSchema>({
    resolver: zodResolver(schema) as Resolver<StudentFormSchema>,
    defaultValues: defaultValues ?? {
      name: "",
      email: "",
      username: "",
      password: "",
      password_confirmation: "",
      admission_number: "",
      class_id: "",
      date_of_birth: "",
      gender: "",
      address: "",
      blood_group: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      parent_occupation: "",
      photo: "",
    },
  });

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>(
        "classes?per_page=100"
      );
      if (r.json?.success && r.json.data?.items) {
        setClasses(r.json.data.items);
      }
    })();
  }, []);

  useEffect(() => {
    if (!defaultValues) return;
    form.reset({
      name: defaultValues.name ?? "",
      email: defaultValues.email ?? "",
      username: defaultValues.username ?? "",
      password: "",
      password_confirmation: "",
      admission_number: defaultValues.admission_number ?? "",
      class_id: defaultValues.class_id ?? "",
      date_of_birth: defaultValues.date_of_birth ?? "",
      gender: defaultValues.gender ?? "",
      address: defaultValues.address ?? "",
      blood_group: defaultValues.blood_group ?? "",
      parent_name: defaultValues.parent_name ?? "",
      parent_phone: defaultValues.parent_phone ?? "",
      parent_email: defaultValues.parent_email ?? "",
      parent_occupation: defaultValues.parent_occupation ?? "",
      photo: defaultValues.photo ?? "",
    });
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPhotoFile(null);
  }, [studentId, mode]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoFile]);

  async function onSubmit(v: StudentFormSchema) {
    setPending(true);
    setFormError(null);
    setApiFieldErrors(null);
    form.clearErrors();
    try {
      const profile = toProfilePayload(v);
      const payload: Record<string, unknown> = { ...profile };

      if (mode === "create") {
        payload.email = v.email.trim();
        payload.username = v.username?.trim() || undefined;
        payload.password = v.password;
        payload.password_confirmation = v.password_confirmation;
      } else if (portalUserId != null) {
        payload.username = v.username?.trim() || undefined;
        if (v.password?.trim()) {
          payload.password = v.password;
          payload.password_confirmation = v.password_confirmation;
        }
      }

      const useMultipart = photoFile != null;
      let r: Awaited<ReturnType<typeof apiFetch<{ student: { id: number } }>>>;

      if (useMultipart) {
        const fd = toFormData(payload);
        fd.append("photo", photoFile);
        const path = mode === "create" ? "students" : `students/${studentId}`;
        const method = mode === "create" ? "POST" : "PUT";
        r = await apiFetch<{ student: { id: number } }>(path, { method, body: fd });
      } else {
        r =
          mode === "create"
            ? await apiJson<{ student: { id: number } }>("students", "POST", payload)
            : await apiJson<{ student: { id: number } }>(
                `students/${studentId}`,
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

      let nextId: number | undefined;
      if (mode === "create") {
        const d = r.json.data;
        if (
          d &&
          typeof d === "object" &&
          "student" in d &&
          typeof (d as { student: { id: number } }).student?.id === "number"
        ) {
          nextId = (d as { student: { id: number } }).student.id;
        }
      } else {
        nextId = studentId;
      }
      if (nextId === undefined) {
        setFormError("Could not read student id from server response.");
        return;
      }
      if (onSaved) {
        onSaved();
        return;
      }
      router.push(`/students/${nextId}`);
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
  const genderWatch = watch("gender") ?? "";
  const bloodWatch = watch("blood_group") ?? "";
  const genderKnown = GENDER_OPTIONS.some((o) => o.value === genderWatch);
  const bloodKnown = BLOOD_GROUP_OPTIONS.some((o) => o.value === bloodWatch);

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
          <div className="flex items-center gap-4">
            <Link
              href="/students"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Students
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {mode === "create" ? "Add student" : "Edit student"}
            </h2>
          </div>
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
          name={displayName?.trim() || "Student"}
          photoUrl={avatarPhotoUrl}
          kind="student"
          size={variant === "dialog" ? "md" : "lg"}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="student_photo">Profile photo (optional)</Label>
          <Input
            id="student_photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setPhotoFile(f);
            }}
          />
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Maximum size 2 MB.</p>
          {errors.photo && (
            <p className="text-xs text-destructive">{errors.photo.message as string}</p>
          )}
        </div>
      </div>

      {mode === "create" ? (
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-medium">Portal login</legend>
          <p className="text-xs text-muted-foreground">
            Sign-in email and initial password. The student can also use an optional username. They will be asked to
            change this password after first sign-in.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="login_email">Sign-in email *</Label>
              <Input id="login_email" type="email" aria-invalid={!!errors.email} {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input id="username" autoComplete="off" aria-invalid={!!errors.username} {...register("username")} />
              <p className="text-xs text-muted-foreground">Letters, numbers, . _ —</p>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Initial password *</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
                autoComplete="new-password"
                aria-invalid={!!errors.password_confirmation}
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
              )}
            </div>
          </div>
        </fieldset>
      ) : null}

      {mode === "edit" && portalUserId != null ? (
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-medium">Portal login</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input id="username" autoComplete="off" aria-invalid={!!errors.username} {...register("username")} />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
                autoComplete="new-password"
                aria-invalid={!!errors.password_confirmation}
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
              )}
            </div>
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        {mode === "edit" ? (
          <div className="space-y-2">
            <Label htmlFor="email">Student email</Label>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="admission_number">Admission number *</Label>
          <Input
            id="admission_number"
            aria-invalid={!!errors.admission_number}
            {...register("admission_number")}
            disabled={mode === "edit"}
          />
          {errors.admission_number && (
            <p className="text-xs text-destructive">{errors.admission_number.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="class_id">Class</Label>
          <select
            id="class_id"
            className={selectFieldClass}
            aria-invalid={!!errors.class_id}
            {...register("class_id")}
          >
            <option value="">Unassigned</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.section ? ` (${c.section})` : ""}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="text-xs text-destructive">{errors.class_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            aria-invalid={!!errors.date_of_birth}
            {...register("date_of_birth")}
          />
          {errors.date_of_birth && (
            <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className={selectFieldClass}
            aria-invalid={!!errors.gender}
            {...register("gender")}
          >
            {GENDER_OPTIONS.map((o, i) => (
              <option key={`g-${i}`} value={o.value}>
                {o.label}
              </option>
            ))}
            {genderWatch && !genderKnown ? (
              <option value={genderWatch}>{genderWatch}</option>
            ) : null}
          </select>
          {errors.gender && (
            <p className="text-xs text-destructive">{errors.gender.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            rows={2}
            aria-invalid={!!errors.address}
            {...register("address")}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="blood_group">Blood group</Label>
          <select
            id="blood_group"
            className={selectFieldClass}
            aria-invalid={!!errors.blood_group}
            {...register("blood_group")}
          >
            {BLOOD_GROUP_OPTIONS.map((o, i) => (
              <option key={`b-${i}`} value={o.value}>
                {o.label}
              </option>
            ))}
            {bloodWatch && !bloodKnown ? (
              <option value={bloodWatch}>{bloodWatch}</option>
            ) : null}
          </select>
          {errors.blood_group && (
            <p className="text-xs text-destructive">{errors.blood_group.message}</p>
          )}
        </div>
      </div>

      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium">Guardian</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parent_name">Parent / guardian name</Label>
            <Input id="parent_name" aria-invalid={!!errors.parent_name} {...register("parent_name")} />
            {errors.parent_name && (
              <p className="text-xs text-destructive">{errors.parent_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_phone">Parent phone</Label>
            <Input id="parent_phone" aria-invalid={!!errors.parent_phone} {...register("parent_phone")} />
            {errors.parent_phone && (
              <p className="text-xs text-destructive">{errors.parent_phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_email">Parent email</Label>
            <Input
              id="parent_email"
              type="email"
              aria-invalid={!!errors.parent_email}
              {...register("parent_email")}
            />
            {errors.parent_email && (
              <p className="text-xs text-destructive">{errors.parent_email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_occupation">Parent occupation</Label>
            <Input id="parent_occupation" aria-invalid={!!errors.parent_occupation} {...register("parent_occupation")} />
            {errors.parent_occupation && (
              <p className="text-xs text-destructive">{errors.parent_occupation.message}</p>
            )}
          </div>
        </div>
      </fieldset>

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
              href="/students"
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
