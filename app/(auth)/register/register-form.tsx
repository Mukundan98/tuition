"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { parseApiErrors } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { TmsLogoMark } from "@/components/brand/tms-logo";
import {
  User,
  Mail,
  Phone,
  UserCheck,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";

const roles = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
];

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState("student");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    setFieldErrors(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
        role,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      const parsed = parseApiErrors(body as Record<string, unknown>);
      if (parsed) {
        setFieldErrors(parsed);
        return;
      }
      setMsg(String(body?.message || "Registration failed. Please check your inputs."));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border-0 bg-white/70 dark:bg-zinc-900/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl rounded-[2rem] overflow-hidden ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in duration-500">
      {/* Brand Header */}
      <CardHeader className="pt-10 pb-6 px-8 text-center bg-gradient-to-b from-muted/30 to-transparent">
        <div className="mx-auto mb-4">
          <TmsLogoMark size={64} className="mx-auto shadow-xl" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter">Create account</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground/80 mt-1.5 leading-normal">
          Register with a role. Admin accounts are provisioned separately.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4 px-8 pb-6">
          {msg && (
            <div className="animate-in fade-in duration-300 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-bold text-rose-600">
              <AlertCircle className="size-4 shrink-0" />
              {msg}
            </div>
          )}

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Full Name
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <User className="size-4" />
              </div>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className={cn(
                  "pl-11 h-12 bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm",
                  fieldErrors?.name
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus-visible:ring-rose-500"
                    : "ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950"
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {fieldErrors?.name?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Email Address
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Mail className="size-4" />
              </div>
              <Input
                id="email"
                type="text"
                autoComplete="email"
                placeholder="name@example.com"
                className={cn(
                  "pl-11 h-12 bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm",
                  fieldErrors?.email
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus-visible:ring-rose-500"
                    : "ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {fieldErrors?.email?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          {/* Phone Input (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Phone Number (Optional)
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Phone className="size-4" />
              </div>
              <Input
                id="phone"
                type="text"
                placeholder="+1 (555) 000-0000"
                className={cn(
                  "pl-11 h-12 bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm",
                  fieldErrors?.phone
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus-visible:ring-rose-500"
                    : "ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950"
                )}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {fieldErrors?.phone?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.phone[0]}
              </p>
            )}
          </div>

          {/* Role Input */}
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Register as
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                <UserCheck className="size-4" />
              </div>
              <select
                id="role"
                className={cn(
                  "pl-11 h-12 w-full bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm outline-none appearance-none cursor-pointer",
                  fieldErrors?.role
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus:ring-rose-500"
                    : "ring-transparent focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950"
                )}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {fieldErrors?.role?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.role[0]}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Password
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Lock className="size-4" />
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  "pl-11 h-12 bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm",
                  fieldErrors?.password
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus-visible:ring-rose-500"
                    : "ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950"
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {fieldErrors?.password?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.password[0]}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Confirm Password
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Lock className="size-4" />
              </div>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  "pl-11 h-12 bg-muted/40 border-0 ring-1 transition-all rounded-xl text-sm",
                  fieldErrors?.password_confirmation
                    ? "ring-rose-500 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] focus-visible:ring-rose-500"
                    : "ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950"
                )}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>
            {fieldErrors?.password_confirmation?.[0] && (
              <p className="text-xs text-rose-500 font-semibold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {fieldErrors.password_confirmation[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 px-8 pb-10">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all rounded-xl group"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Workspace Account...
              </>
            ) : (
              <span className="flex items-center gap-2">
                Create Account
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>

          {/* Divider */}
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40"></span>
            </div>
            <span className="relative bg-transparent px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              Tuition Management System
            </span>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-xs font-medium text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
