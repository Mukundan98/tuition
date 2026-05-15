"use client";

import { apiFetch, apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeeDetail } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** Avoid float noise in the amount field. */
function formatAmountForInput(balance: number): string {
  return Number(balance.toFixed(2)).toFixed(2);
}

function parsePayAmount(raw: string, max: number): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0.01) {
    return null;
  }
  const maxRounded = Number(max.toFixed(2));
  return Math.min(Number(n.toFixed(2)), maxRounded);
}

type PayHereCheckoutData = {
  action_url: string;
  fields: Record<string, string>;
};

/** POST redirect to PayHere Hosted Checkout using server-signed payload. */
function postToPayHere(data: PayHereCheckoutData): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.action_url;
  form.acceptCharset = "UTF-8";
  for (const [name, value] of Object.entries(data.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value ?? "");
    form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}

export function PayHereFeePayClient() {
  const { id } = useParams<{ id: string }>();
  const feeId = Number(id);
  const router = useRouter();

  const [fee, setFee] = useState<FeeDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const currencyLabel = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_PAYHERE_CURRENCY ?? "LKR").trim().toUpperCase() ||
      "LKR",
    []
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(feeId) || feeId < 1) {
      setLoadErr("Invalid fee");
      return;
    }
    const r = await apiFetch<{ fee: FeeDetail }>(`fees/${feeId}`);
    if (!r.ok || !r.json?.success || !r.json.data?.fee) {
      setLoadErr(r.json?.message ?? "Not found");
      setFee(null);
      return;
    }
    setLoadErr(null);
    const f = r.json.data.fee;
    setFee(f);
    if (f.balance > 0) {
      setPayAmountStr(formatAmountForInput(f.balance));
    }
  }, [feeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parsedAmount = fee ? parsePayAmount(payAmountStr, fee.balance) : null;
  const remainingAfterPay =
    parsedAmount !== null && fee ? Math.max(0, Number((fee.balance - parsedAmount).toFixed(2))) : null;

  async function handlePayHere() {
    if (parsedAmount === null || !fee) {
      toast.error("Enter a valid amount.");
      return;
    }

    setRedirecting(true);

    try {
      const r = await apiJson<PayHereCheckoutData>("payhere/checkout", "POST", {
        fee_id: feeId,
        amount: parsedAmount,
      });

      const payload = r.json?.data;
      if (!r.ok || !r.json?.success || !payload?.action_url || !payload.fields) {
        toast.error(
          (r.json?.message as string | undefined) ?? "PayHere checkout could not be started."
        );
        return;
      }

      toast.success("Redirecting to PayHere…");
      postToPayHere(payload);
    } catch {
      toast.error("Could not start PayHere checkout.");
    } finally {
      setRedirecting(false);
    }
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-destructive">{loadErr}</p>
        <Button variant="outline" type="button" onClick={() => void load()} className="w-full sm:w-auto">
          Retry
        </Button>
        <Link href="/fees" className="mt-2 block text-sm text-muted-foreground hover:underline">
          ← Fees
        </Link>
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (fee.balance <= 0.009) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-muted-foreground">This fee has no outstanding balance.</p>
        <Link href={`/fees/${feeId}`} className="text-sm text-muted-foreground hover:underline">
          ← Fee details
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <h2 className="mt-2 text-2xl font-semibold">Pay with PayHere</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ll finish payment securely on PayHere. The fee balance updates when PayHere confirms
          payment to the server (&quot;notify&quot; URL). Use live keys only on HTTPS with a reachable API
          URL.
        </p>
      </div>

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-medium text-muted-foreground">Fee summary</h3>
        </div>
        <dl className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-muted-foreground">Fee</dt>
            <dd className="font-medium">{fee.title}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Student</dt>
            <dd className="font-medium">
              {fee.student?.name ?? "—"} · {fee.student?.admission_number ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Total fee</dt>
            <dd className="tabular-nums font-medium">{Number(fee.amount).toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Already paid</dt>
            <dd className="tabular-nums font-medium">{Number(fee.paid_total ?? 0).toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Balance due</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {fee.balance.toFixed(2)} {currencyLabel}
            </dd>
          </div>
          {parsedAmount !== null ? (
            <div className="sm:col-span-2 lg:col-span-2">
              <dt className="text-sm text-muted-foreground">You are paying</dt>
              <dd className="text-lg font-semibold tabular-nums text-primary">
                {parsedAmount.toFixed(2)} {currencyLabel}
              </dd>
              {remainingAfterPay !== null && remainingAfterPay > 0 ? (
                <dd className="mt-1 text-xs text-muted-foreground">
                  After confirmation, roughly{" "}
                  <span className="font-medium tabular-nums">{remainingAfterPay.toFixed(2)}</span>{" "}
                  {currencyLabel} may remain until fully settled.
                </dd>
              ) : parsedAmount !== null && fee.balance - parsedAmount <= 0.01 ? (
                <dd className="mt-1 text-xs text-muted-foreground">This payment can clear the balance.</dd>
              ) : null}
            </div>
          ) : null}
        </dl>
      </section>

      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h3 className="text-base font-semibold">Checkout</h3>
        <div className="space-y-2">
          <Label htmlFor="pay_amt">Amount to pay (max {fee.balance.toFixed(2)})</Label>
          <Input
            id="pay_amt"
            type="number"
            step="0.01"
            min="0.01"
            max={fee.balance}
            value={payAmountStr}
            onChange={(e) => setPayAmountStr(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Currency ({currencyLabel}) is set server-side alongside your merchant account — keep{" "}
            <code className="text-[0.85em]">PAYHERE_CURRENCY</code>,{" "}
            <code className="text-[0.85em]">NEXT_PUBLIC_PAYHERE_CURRENCY</code> here in sync only for labels.
          </p>
        </div>
        {parsedAmount === null ? (
          <p className="text-sm text-destructive">Enter a valid amount between 0.01 and the balance.</p>
        ) : null}

        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={parsedAmount === null || redirecting}
          onClick={() => void handlePayHere()}
        >
          {redirecting ? "Starting checkout…" : `Continue to PayHere (${parsedAmount?.toFixed(2) ?? "—"})`}
        </Button>
      </div>
    </div>
  );
}
