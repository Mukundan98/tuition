"use client";

import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { TmsLogoMark } from "@/components/brand/tms-logo";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    setFieldErrors(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      const parsed = parseApiErrors(body as Record<string, unknown>);
      if (parsed) {
        setFieldErrors(parsed);
        return;
      }
      setMsg(
        String(body?.message || "Could not sign in. Check your details.")
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="border-0 bg-white/70 dark:bg-zinc-900/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl rounded-[2rem] overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
      <CardHeader className="pt-10 pb-8 px-8 text-center bg-gradient-to-b from-muted/30 to-transparent">
        <div className="mx-auto mb-6">
          <TmsLogoMark size={64} className="mx-auto shadow-xl" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter">Welcome back</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground/80 mt-1.5">
          Enter your credentials to access your workspace.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6 px-8 pb-8">
          {fieldErrors && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <ApiValidationSummary errors={fieldErrors} />
            </div>
          )}
          {msg && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-bold text-rose-600">
              <ShieldCheck className="size-4 shrink-0" />
              {msg}
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
              Email or Username
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Mail className="size-4" />
              </div>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                required
                placeholder="vinit@gmail.com"
                className="pl-11 h-12 bg-muted/40 border-0 ring-1 ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950 transition-all rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-wider"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                <Lock className="size-4" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="pl-11 pr-11 h-12 bg-muted/40 border-0 ring-1 ring-transparent focus-visible:ring-indigo-500/50 focus-visible:bg-white dark:focus-visible:bg-zinc-950 transition-all rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 px-8 pb-10">
          <Button
            type="submit"
            className="w-full h-12 bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all rounded-xl group"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              <span className="flex items-center gap-2">
                Sign into Workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>

          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40"></span>
            </div>
            <span className="relative bg-transparent px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              Security Guarantee
            </span>
          </div>

          {/* <p className="text-center text-xs font-medium text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign up today
            </Link>
          </p> */}
        </CardFooter>
      </form>
    </Card>
  );
}

