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
import type { AttendanceReportRow, ListMeta, SchoolClassRow } from "@/lib/types";

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AttendanceReportClient() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayISO);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AttendanceReportRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) {
        setClasses(r.json.data.items);
        if (r.json.data.items[0]?.id != null) setClassId(String(r.json.data.items[0].id));
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "25" });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (classId) qs.set("class_id", classId);
    if (studentId.trim()) qs.set("student_id", studentId.trim());
    const r = await apiFetch<{ items: AttendanceReportRow[]; meta: ListMeta }>(
      `attendances/report?${qs}`
    );
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load");
      setItems([]);
      setMeta(null);
      return;
    }
    setErr(null);
    setItems(r.json.data.items);
    setMeta(r.json.data.meta);
  }, [page, from, to, classId, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function doExport(kind: "pdf" | "csv") {
    if (!classId) {
      setErr("Select a class for export.");
      return;
    }
    setExporting(kind);
    setErr(null);
    const qs = new URLSearchParams({
      class_id: classId,
      from,
      to,
    });
    if (studentId.trim()) qs.set("student_id", studentId.trim());
    const path = `attendances/export/${kind}?${qs}`;
    const r = await apiDownload(path);
    setExporting(null);
    if (!r.ok) {
      setErr("Export failed (check date range and permissions).");
      return;
    }
    const name =
      r.filename?.replace(/"/g, "") ||
      (kind === "pdf" ? "attendance.pdf" : "attendance.csv");
    triggerBrowserDownload(r.blob, name);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Attendance report</h2>
          <p className="text-sm text-muted-foreground">Filter, paginate, export PDF or CSV.</p>
        </div>
        <Link href="/attendance" className="text-sm text-indigo-600 hover:underline">
          ← Mark attendance
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
          <Label>Class</Label>
          <select
            className="flex h-9 w-48 rounded-md border border-input bg-background px-2 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Any</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sid">Student ID</Label>
          <Input
            id="sid"
            className="w-28"
            placeholder="optional"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!classId || exporting !== null}
          onClick={() => void doExport("pdf")}
        >
          {exporting === "pdf" ? "PDF…" : "PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!classId || exporting !== null}
          onClick={() => void doExport("csv")}
        >
          {exporting === "csv" ? "CSV…" : "Excel (CSV)"}
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={5} />}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No rows.</TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.attended_on}</TableCell>
                  <TableCell>
                    {row.student?.name ?? "—"}{" "}
                    <span className="text-muted-foreground text-xs">
                      {row.student?.admission_number}
                    </span>
                  </TableCell>
                  <TableCell>{row.class?.name ?? "—"}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {row.remark ?? ""}
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
