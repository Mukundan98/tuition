"use client";

import {
  CreditCard,
  Receipt,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Calendar,
  History,
  Info,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaginationBar } from "@/components/crud/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FeeRow, ListMeta } from "@/lib/types";

type Payload = {
  student: { id: number; name: string; admission_number: string };
  items: FeeRow[];
  meta: ListMeta;
};

function badgeClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-900";
    case "partial":
      return "bg-amber-100 text-amber-950";
    case "overdue":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function StudentMyFeesClient({
  studentId,
  variant,
}: {
  studentId: number;
  variant: "student" | "admin";
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<Payload>(
      `students/${studentId}/fees?page=${page}&per_page=20`
    );
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [studentId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const profileHref = `/students/${studentId}`;

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        {variant === "admin" ? (
          <Link href={profileHref} className="text-sm text-muted-foreground hover:underline">
            ← Profile
          </Link>
        ) : (
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Dashboard
          </Link>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 p-8 animate-pulse">
        <header className="flex flex-col gap-6">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-40 w-full bg-muted rounded-[2rem]" />
        </header>
        <section className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </section>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals for cards
  const totalDue = data.items.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPaid = data.items.reduce((acc, curr) => acc + Number(curr.paid_total), 0);
  const totalBalance = data.items.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              <CreditCard className="size-3 text-indigo-500" />
              {variant === "student" ? "Financial Overview" : `Fees Management`}
            </div>
            <h1 className="text-2xl font-black tracking-tight">{variant === "student" ? "Fee Statements" : data.student.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {variant === "admin" ? (
              <Link
                href="/fees/new"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-3 text-[10px] font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"
              >
                + New Fee
              </Link>
            ) : null}
            <Link
              href={variant === "admin" ? profileHref : "/dashboard"}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border/40 bg-background/50 px-3 text-[10px] font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider"
            >
              {variant === "admin" ? "← Profile" : "← Dashboard"}
            </Link>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-[1.5rem] border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
          <CardContent className="relative flex flex-col md:flex-row items-center gap-5 p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
              <Receipt className="size-7 text-white" />
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight">Manage Your Finances</h2>
              <p className="text-indigo-100 text-xs mt-0.5 opacity-90 truncate">
                Admission ID: <span className="font-bold text-white">{data.student.admission_number}</span> &middot; Detailed breakdown below.
              </p>
            </div>
            <div className="hidden md:block border-l border-white/10 pl-6 py-1">
              <div className="space-y-0 text-right">
                <p className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold">Outstanding</p>
                <p className="text-2xl font-black tracking-tighter text-white">LKR {totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Amount Due", value: totalDue, icon: Banknote, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Total Paid", value: totalPaid, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Remaining Balance", value: totalBalance, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-500/10" },
        ].map((item) => (
          <Card key={item.label} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/85 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {item.label}
              </CardDescription>
              <div className={cn("rounded-lg p-2 transition-colors", item.bg)}>
                <item.icon className={cn("size-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground/90 tabular-nums">
                LKR {item.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <History className="size-5 text-indigo-500" />
            Transaction History
          </h2>
        </div>

        {data.items.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 bg-muted/20 p-12 text-center">
            <Receipt className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">No Fee Records Found</CardTitle>
            <CardDescription className="max-w-xs mx-auto mt-2">
              Your financial records are currently clean. No fees have been assigned to your account yet.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-4">
            {data.items.map((row) => (
              <Card
                key={row.id}
                className="group relative overflow-hidden rounded-[1.25rem] border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className="flex-1 p-5 min-w-0 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          row.status === 'paid' ? "bg-emerald-500/10 text-emerald-600" :
                            row.status === 'partial' ? "bg-amber-500/10 text-amber-600" :
                              "bg-rose-500/10 text-rose-600"
                        )}>
                          {row.status === 'paid' && <CheckCircle2 className="size-2.5" />}
                          {row.status === 'partial' && <TrendingUp className="size-2.5" />}
                          {row.status === 'overdue' && <AlertCircle className="size-2.5" />}
                          {row.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground flex-nowrap">
                          <Calendar className="size-3" />
                          Due: {row.due_date}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                        {row.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 border-t md:border-t-0 md:border-l border-border/40 bg-muted/5 min-w-[280px]">
                      <div className="p-4 flex flex-col justify-center border-r border-border/40">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Total Fee</p>
                        <p className="text-sm font-bold tabular-nums">LKR {Number(row.amount).toLocaleString()}</p>
                      </div>
                      <div className="p-4 flex flex-col justify-center lg:border-r border-border/40">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Balance</p>
                        <p className={cn(
                          "text-sm font-black tabular-nums",
                          Number(row.balance) > 0 ? "text-rose-600" : "text-emerald-600"
                        )}>LKR {Number(row.balance).toLocaleString()}</p>
                      </div>
                      <div className="p-0 col-span-2 lg:col-span-1 border-t lg:border-t-0 border-border/40">
                        <Link
                          href={`/fees/${row.id}`}
                          className="flex items-center justify-center h-full w-full py-4 text-xs font-bold text-indigo-600 hover:bg-indigo-500/10 transition-all uppercase tracking-widest gap-2"
                        >
                          View Receipt
                          <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.meta.last_page > 1 && (
          <div className="pt-4 flex justify-end">
            <PaginationBar meta={data.meta} onPage={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
