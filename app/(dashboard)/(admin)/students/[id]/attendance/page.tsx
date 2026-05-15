"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { AttendanceReportRow } from "@/lib/types";

function firstOfSchoolYear(): string {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-07-01`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Payload = {
  student: {
    id: number;
    name: string;
    admission_number: string;
  };
  summary: {
    records: number;
    by_status: Record<string, number>;
    present_rate_percent: number | null;
  };
  items: AttendanceReportRow[];
};

export default function StudentAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const [from, setFrom] = useState(firstOfSchoolYear);
  const [to, setTo] = useState(todayISO);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const r = await apiFetch<Payload>(
      `students/${id}/attendances${qs.size ? `?${qs}` : ""}`
    );
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [id, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Student attendance {data?.student?.name ? `— ${data.student.name}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">{data?.student?.admission_number}</p>
        </div>
        <Link href={`/students/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Profile
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="fafrom">From</Label>
          <Input id="fafrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fato">To</Label>
          <Input id="fato" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Apply range
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {data?.summary && (
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border px-4 py-3">
            <dt className="text-xs text-muted-foreground">Records</dt>
            <dd className="text-xl font-semibold tabular-nums">{data.summary.records}</dd>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <dt className="text-xs text-muted-foreground">Present rate %</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {data.summary.present_rate_percent ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border px-4 py-3 text-sm">
            <dt className="text-xs text-muted-foreground mb-1">By status</dt>
            <dd className="tabular-nums">
              P {data.summary.by_status?.present ?? 0} · A {data.summary.by_status?.absent ?? 0} · L{" "}
              {data.summary.by_status?.late ?? 0} · E {data.summary.by_status?.excused ?? 0}
            </dd>
          </div>
        </dl>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={4} />}
            {!loading && data?.items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No attendance in this range.</TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.attended_on}</TableCell>
                  <TableCell>
                    {row.class?.name ?? "—"}
                    {row.class?.section ? ` (${row.class.section})` : ""}
                  </TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {row.remark ?? ""}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
