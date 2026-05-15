"use client";

import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  KeyRound,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-context";
import { apiJson } from "@/lib/api";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/45",
        className
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:from-indigo-400/10 dark:to-violet-400/10 dark:text-indigo-400">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
}

export function AccountProfileClient() {
  const { user, status, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwFieldErrors, setPwFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwPending(true);
    setPwMsg(null);
    setPwFieldErrors(null);
    const r = await apiJson("auth/password", "PATCH", {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
    setPwPending(false);
    if (!r.ok || !r.json?.success) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        setPwFieldErrors(parsed);
        return;
      }
      setPwMsg(r.json?.message ?? "Could not update password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwMsg("Password updated.");
    await refresh();
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <div className="size-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-medium text-foreground">You are not signed in.</p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-indigo-600 to-violet-600")}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/[0.09] via-violet-500/[0.05] to-transparent dark:from-indigo-500/10 dark:via-violet-500/[0.07]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Dashboard
            </Link>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your profile
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Account details for this tuition portal. Keep your password strong and unique.
            </p>
          </div>
        </div>

        {user.must_change_password ? (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3.5 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/20 dark:text-amber-100"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 dark:bg-amber-400/15">
              <KeyRound className="size-5 text-amber-700 dark:text-amber-300" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold">Set a new password</p>
              <p className="mt-1 text-amber-900/85 dark:text-amber-100/80">
                You must choose a new password before using the rest of the site. Update it below, then return to the
                dashboard.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg shadow-indigo-500/5 ring-1 ring-border/60 dark:shadow-none">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" aria-hidden />
            <CardHeader className="space-y-0 pb-2 pt-5">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <Avatar className="size-20 border-4 border-background shadow-md ring-2 ring-indigo-500/20 sm:size-24">
                  {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-xl font-semibold text-white sm:text-2xl">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-center sm:pt-1 sm:text-left">
                  <CardTitle className="text-xl font-semibold sm:text-2xl">{user.name}</CardTitle>
                  <CardDescription className="mt-1.5 text-base">{user.email}</CardDescription>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                      <Shield className="size-3.5" aria-hidden />
                      {user.role?.name ?? "Member"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                        user.is_active
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <BadgeCheck className="size-3.5" aria-hidden />
                      {user.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6 pt-2">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <InfoRow icon={User} label="Display name" value={user.name} className="sm:col-span-2" />
                <InfoRow icon={Mail} label="Email" value={user.email} />
                {user.username ? <InfoRow icon={AtSign} label="Username" value={user.username} /> : null}
                {user.phone ? <InfoRow icon={Phone} label="Phone" value={user.phone} /> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg shadow-violet-500/5 ring-1 ring-border/60 dark:shadow-none">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-700 dark:text-violet-300">
                  <KeyRound className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription className="mt-1 text-sm leading-relaxed">
                    Use a strong password you have not reused on other sites. Minimum 8 characters.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={(e) => void submitPassword(e)} className="space-y-5">
                {pwFieldErrors && <ApiValidationSummary errors={pwFieldErrors} />}
                {pwMsg && !pwFieldErrors && (
                  <p className="rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100">
                    {pwMsg}
                  </p>
                )}
                <div className="space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 sm:p-5">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-sm font-medium">
                      Current password
                    </Label>
                    <Input
                      id="current_password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-11 border-border/80 bg-background"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-sm font-medium">
                        New password
                      </Label>
                      <Input
                        id="new_password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 border-border/80 bg-background"
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-sm font-medium">
                        Confirm new password
                      </Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 border-border/80 bg-background"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={pwPending}
                  size="lg"
                  className="h-11 w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold shadow-md shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500"
                >
                  {pwPending ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="border-t border-border/50 bg-muted/10 text-xs text-muted-foreground">
              After changing your password, you may need to sign in again on other devices.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
