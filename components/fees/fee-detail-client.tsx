"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { ApiValidationSummary } from "@/components/ui/api-validation-summary";
import { apiDownload, apiFetch, apiJson, triggerBrowserDownload } from "@/lib/api";
import { parseApiErrors } from "@/lib/api-errors";
import type { FeeDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FeeDetailClient({ variant = "admin" }: { variant?: "admin" | "student" }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fee, setFee] = useState<FeeDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [payFieldErrors, setPayFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [paying, setPaying] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delPending, setDelPending] = useState(false);

  const [payAmount, setPayAmount] = useState("");
  const [payAt, setPayAt] = useState(() =>
    toLocalDatetimeValue(new Date().toISOString())
  );
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ fee: FeeDetail }>(`fees/${id}`);
    if (!r.ok || !r.json?.success || !r.json.data?.fee) {
      setErr(r.json?.message ?? "Not found");
      setFee(null);
      return;
    }
    setErr(null);
    setFee(r.json.data.fee);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxPay = fee?.balance ?? 0;

  useEffect(() => {
    if (fee && Number(fee.balance) > 0) {
      setPayAmount(String(fee.balance));
    }
  }, [fee]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!fee) return;
    setPayErr(null);
    setPayFieldErrors(null);
    setPaying(true);
    const amount = Number(payAmount);
    const paid_iso = payAt.length >= 16 ? new Date(payAt).toISOString() : "";
    const r = await apiJson<{ fee: FeeDetail }>(`fees/${fee.id}/payments`, "POST", {
      amount,
      paid_at: paid_iso,
      payment_method: payMethod.trim() || undefined,
      reference: payRef.trim() || undefined,
    });
    setPaying(false);
    if (!r.ok || !r.json?.success || !r.json.data?.fee) {
      const parsed = parseApiErrors(r.json as Record<string, unknown>);
      if (parsed) {
        setPayFieldErrors(parsed);
        return;
      }
      setPayErr((r.json?.message as string | undefined) ?? "Payment failed");
      return;
    }
    setPayFieldErrors(null);
    setFee(r.json.data.fee);
    setPayAmount(String(Math.max(0, r.json.data.fee.balance)));
  }

  async function downloadReceipt(paymentId: number) {
    const r = await apiDownload(`fee-payments/${paymentId}/receipt/pdf`);
    if (!r.ok) return;
    const name =
      r.filename?.replace(/"/g, "").replace(/^UTF-8''/, "") ??
      `receipt-${paymentId}.pdf`;
    triggerBrowserDownload(r.blob, name || `receipt-${paymentId}.pdf`);
  }

  async function confirmDelete() {
    setDelPending(true);
    await apiJson(`fees/${id}`, "DELETE");
    setDelPending(false);
    setDelOpen(false);
    router.replace(
      variant === "admin" && fee ? `/students/${fee.student_id}/fees` : "/fees"
    );
    router.refresh();
  }

  const canPay = useMemo(() => fee && fee.balance > 0.009, [fee]);

  if (err) {
    return (
      <div className="space-y-2 p-8">
        <p className="text-destructive">{err}</p>
        <Link
          href={variant === "student" ? "/fees" : "/fees/report"}
          className="text-sm text-muted-foreground hover:underline"
        >
          {variant === "student" ? "← My fees" : "← Fees report"}
        </Link>
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
        <div>
          <Skeleton className="mb-3 h-5 w-28" />
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeletonRows columns={5} lastColumnRight />
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={variant === "student" ? "/fees" : "/fees/report"}
            className="text-sm text-muted-foreground hover:underline"
          >
            {variant === "student" ? "← My fees" : "← Fees report"}
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{fee.title}</h2>
          <p className="text-sm text-muted-foreground">
            {fee.student?.name} · {fee.student?.admission_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variant === "admin" ? (
            <>
              <Link
                href={`/students/${fee.student_id}/fees`}
                className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted"
              >
                Student fees
              </Link>
              <Button variant="destructive" type="button" onClick={() => setDelOpen(true)}>
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {variant === "admin" ? (
        <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete fee</AlertDialogTitle>
              <AlertDialogDescription>
                Removes this fee and all recorded payments for it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={delPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <dl className="grid gap-4 rounded-xl border bg-card p-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Amount due</dt>
          <dd className="text-lg font-semibold tabular-nums">{fee.amount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="text-lg font-semibold tabular-nums">{fee.paid_total}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Balance</dt>
          <dd className="text-lg font-semibold tabular-nums">{fee.balance}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${badgeClass(fee.status)}`}
            >
              {fee.status}
            </span>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="font-medium">{fee.due_date}</dd>
        </div>
        {fee.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{fee.notes}</dd>
          </div>
        ) : null}
      </dl>

      {canPay ? (
        variant === "admin" ? (
          <form
            id="pay"
            onSubmit={(e) => void submitPayment(e)}
            className="space-y-4 rounded-xl border p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-medium">Record payment</h3>
              <Link
                href={`/fees/${fee.id}/pay`}
                className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
              >
                Pay with PayHere
              </Link>
            </div>
            {payFieldErrors && <ApiValidationSummary errors={payFieldErrors} />}
            {payErr && <p className="text-sm text-destructive">{payErr}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p_amt">Amount * (max {maxPay})</Label>
                <Input
                  id="p_amt"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxPay}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_at">Paid at *</Label>
                <Input
                  id="p_at"
                  type="datetime-local"
                  value={payAt}
                  onChange={(e) => setPayAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_m">Method</Label>
                <Input
                  id="p_m"
                  placeholder="Cash, card, transfer…"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_r">Reference</Label>
                <Input id="p_r" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={paying}>
              {paying ? "Saving…" : "Record payment"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 rounded-xl border p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-medium">Payment</h3>
              <Link
                href={`/fees/${fee.id}/pay`}
                className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
              >
                Pay with PayHere
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Use PayHere to pay online, or contact the office if you pay by cash or transfer.
            </p>
          </div>
        )
      ) : null}

      <div>
        <h3 className="mb-3 font-medium">Payments</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fee.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No payments yet.</TableCell>
                </TableRow>
              ) : null}
              {fee.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">
                    {new Date(p.paid_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.amount}</TableCell>
                  <TableCell>{p.payment_method ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.reference ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void downloadReceipt(p.id)}
                    >
                      Receipt PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
