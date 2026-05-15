"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { PaginationBar } from "@/components/crud/pagination-bar";
import { apiDownload, apiFetch, triggerBrowserDownload } from "@/lib/api";
import type { FeeReportPaymentRow, ListMeta, StudentRow } from "@/lib/types";

function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FeesReportClient() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState(monthStartISO);
  const [to, setTo] = useState(todayISO);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeeReportPaymentRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exp, setExp] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: StudentRow[] }>("students?per_page=200");
      if (r.json?.success && r.json.data?.items) setStudents(r.json.data.items);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "25" });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (studentId) qs.set("student_id", studentId);
    const r = await apiFetch<{ items: FeeReportPaymentRow[]; meta: ListMeta }>(
      `fees/report?${qs}`
    );
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed.");
      setItems([]);
      setMeta(null);
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setMeta(r.json.data.meta);
  }, [page, from, to, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function csv() {
    setExp(true);
    setErr(null);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (studentId) qs.set("student_id", studentId);
    const r = await apiDownload(`fees/export/csv?${qs}`);
    setExp(false);
    if (!r.ok) {
      setErr("Export failed.");
      return;
    }
    const name = r.filename?.replace(/"/g, "") ?? "fee-payments.csv";
    triggerBrowserDownload(r.blob, name);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Fee payments report</h2>
          <p className="text-sm text-muted-foreground">Collections by date range.</p>
        </div>
        <Link href="/fees/report" className="text-sm text-indigo-600 hover:underline">
          ← Fees report
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <div className="space-y-2">
          <Label>Student</Label>
          <select
            className="flex h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fr_from">From</Label>
          <Input id="fr_from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fr_to">To</Label>
          <Input id="fr_to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        <Button type="button" variant="outline" disabled={exp} onClick={() => void csv()}>
          {exp ? "…" : "Excel (CSV)"}
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paid at</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={6} />}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No payments in range.</TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {new Date(row.paid_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {row.student?.name ?? "—"}{" "}
                    <span className="text-xs text-muted-foreground">
                      {row.student?.admission_number}
                    </span>
                  </TableCell>
                  <TableCell>{row.fee_title ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
                  <TableCell>{row.payment_method ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.recorded_by?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {meta && !loading && meta.last_page > 1 && (
          <PaginationBar meta={meta} onPage={setPage} />
        )}
      </div>
    </div>
  );
}
