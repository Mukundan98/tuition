"use client";

import Link from "next/link";
import { ArrowUpRight, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { FeeOverviewStats, FeeRow } from "@/lib/types";

export function PendingFeesWidget() {
  const [overview, setOverview] = useState<FeeOverviewStats | null>(null);
  const [rows, setRows] = useState<FeeRow[]>([]);

  useEffect(() => {
    void (async () => {
      const [o, p] = await Promise.all([
        apiFetch<FeeOverviewStats>("fees/overview"),
        apiFetch<{ items: FeeRow[] }>("fees/pending?per_page=8"),
      ]);
      if (o.json?.success && o.json.data) setOverview(o.json.data);
      if (p.json?.success && p.json.data?.items) setRows(p.json.data.items);
    })();
  }, []);

  if (!overview && rows.length === 0) {
    return (
      <Card className="rounded-3xl border-border/60 border-dashed bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <PiggyBank className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
            Outstanding fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <div className="space-y-2 border-t border-border/50 pt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-2">
                <Skeleton className="h-4 max-w-[70%] flex-1" />
                <Skeleton className="h-4 w-14 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[2rem] border-border/60 bg-card/75 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/50 group-hover:bg-amber-500 transition-all duration-300" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border/50 pb-3 pl-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
            <PiggyBank className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Outstanding fees
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">Pending balances and recent rows</CardDescription>
        </div>
        <Link
          href="/fees/report"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Overdue
          <ArrowUpRight className="size-3.5 opacity-80" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm pl-6">
        {overview && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/5 to-transparent p-3 transition-all duration-300 hover:border-indigo-500/25">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Balance due</p>
              <p className="mt-1 text-xl font-black tabular-nums tracking-tight text-foreground">{overview.pending_balance}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-3 transition-all duration-300 hover:border-rose-500/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800/80 dark:text-rose-200/80">
                Overdue notices
              </p>
              <p className="mt-1 text-xl font-black tabular-nums tracking-tight text-rose-700 dark:text-rose-300">
                {overview.overdue_count}
              </p>
            </div>
          </div>
        )}
        <ul className="max-h-[220px] space-y-1 overflow-y-auto border-t border-border/50 pt-3 scrollbar-thin">
          {rows.length === 0 && <li className="text-muted-foreground py-2 text-xs italic">No pending rows.</li>}
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl p-2 transition-all duration-200 hover:bg-muted/40 text-xs sm:text-sm">
              <Link href={`/fees/${r.id}`} className="min-w-0 truncate font-semibold text-foreground hover:text-indigo-600 transition-colors">
                {r.student?.name ?? "—"} <span className="font-normal text-muted-foreground">— {r.title}</span>
              </Link>
              <span className="shrink-0 tabular-nums font-bold text-amber-600 dark:text-amber-400">{r.balance}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/fees/report"
          className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
        >
          Fee payments report
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
