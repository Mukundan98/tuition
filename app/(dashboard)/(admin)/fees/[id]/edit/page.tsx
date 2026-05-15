"use client";

import { FeeForm } from "@/components/fees/fee-form";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type FeeEdit = {
  title: string;
  notes: string | null;
  amount: string;
  due_date: string;
};

export default function EditFeePage() {
  const { id } = useParams<{ id: string }>();
  const feeId = Number(id);
  const [row, setRow] = useState<FeeEdit | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(feeId) || feeId < 1) {
      setErr("Invalid fee.");
      return;
    }
    let alive = true;
    void (async () => {
      const r = await apiFetch<{ fee: FeeEdit }>(`fees/${feeId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.fee) {
        setErr(r.json?.message ?? "Not found.");
        setRow(null);
        return;
      }
      const f = r.json.data.fee;
      setRow({
        title: f.title,
        notes: f.notes,
        amount: f.amount,
        due_date: f.due_date,
      });
      setErr(null);
    })();
    return () => {
      alive = false;
    };
  }, [feeId]);

  if (err) {
    return (
      <div className="space-y-3 p-8">
        <p className="text-destructive">{err}</p>
        <Link href="/fees/report" className="text-sm text-muted-foreground hover:underline">
          ← Fees report
        </Link>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <FeeForm
      mode="edit"
      feeId={feeId}
      variant="page"
      defaultEdit={{
        title: row.title,
        notes: row.notes ?? "",
        amount: row.amount,
        due_date: row.due_date,
      }}
    />
  );
}
