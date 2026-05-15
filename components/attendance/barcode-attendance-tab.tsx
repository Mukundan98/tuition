"use client";

import Link from "next/link";
import { Barcode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { apiFetch, apiJson } from "@/lib/api";
import { humanizeFieldName, parseApiErrors } from "@/lib/api-errors";
import type { AttendanceDayStudentRow, SchoolClassRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES = ["present", "absent", "late", "excused"] as const;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toLowerCase();
}

function barcodeFailMessage(
  json: Record<string, unknown> | null | undefined,
  fallback: string
): string {
  const parsed = parseApiErrors(json);
  if (parsed) {
    const lines: string[] = [];
    for (const [k, msgs] of Object.entries(parsed)) {
      for (const m of msgs) {
        if (m) lines.push(`${humanizeFieldName(k)}: ${m}`);
      }
    }
    if (lines.length) return lines.join("\n");
  }
  const top = json && typeof json.message === "string" ? json.message : undefined;
  return top ?? fallback;
}

type ScanLogEntry = {
  id: string;
  at: string;
  raw: string;
  name: string;
  admission_number: string;
  status: string;
  ok: boolean;
  message?: string;
};

type BarcodeResponse = {
  student: {
    id: number;
    name: string;
    admission_number: string;
  };
  attendance: { id: number; status: string; remark: string | null } | null;
};

type PendingConfirm = {
  code: string;
  previewStudent: Pick<AttendanceDayStudentRow, "student_id" | "name" | "admission_number"> | null;
};

export function BarcodeAttendanceTab() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayISO);
  const [rows, setRows] = useState<AttendanceDayStudentRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [status, setStatus] = useState<string>("present");
  const [scanInput, setScanInput] = useState("");
  const [confirmBeforeSave, setConfirmBeforeSave] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [log, setLog] = useState<ScanLogEntry[]>([]);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) {
        const list = r.json.data.items;
        setClasses(list);
        setClassId((prev) => prev || (list[0]?.id != null ? String(list[0].id) : ""));
      }
    })();
  }, []);

  const loadDay = useCallback(async () => {
    if (!classId || !date) {
      setRows([]);
      return;
    }
    setLoadingRows(true);
    const r = await apiFetch<{ students: AttendanceDayStudentRow[] }>(
      `classes/${classId}/attendances/day?date=${encodeURIComponent(date)}`
    );
    setLoadingRows(false);
    if (!r.ok || !r.json?.success || !r.json.data?.students) {
      setRows([]);
      return;
    }
    setRows(r.json.data.students);
  }, [classId, date]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  function matchLocal(code: string): AttendanceDayStudentRow | undefined {
    const n = normCode(code);
    if (!n) return undefined;
    if (/^SID[:\s.\-.]*(\d+)$/i.test(code.trim())) return undefined;

    return rows.find((row) => {
      const adm = normCode(row.admission_number);
      return adm === n || row.admission_number.trim().toLowerCase() === code.trim().toLowerCase();
    });
  }

  async function saveScan(codeRaw: string) {
    const code = codeRaw.trim();
    if (!code || !classId) return;

    setSubmitting(true);

    try {
      const r = await apiJson<BarcodeResponse>(
        `classes/${classId}/attendances/barcode`,
        "POST",
        {
          date,
          code,
          status,
        }
      );

      if (!r.ok || !r.json?.success || !r.json.data?.student) {
        const msg = barcodeFailMessage(r.json as Record<string, unknown> | null, "Unknown barcode.");
        setLog((prev) => [
          {
            id: `${Date.now()}-err`,
            at: new Date().toISOString(),
            raw: code,
            name: "—",
            admission_number: "—",
            status,
            ok: false,
            message: msg,
          },
          ...prev,
        ].slice(0, 40));
        return;
      }

      const d = r.json.data;
      const stu = d.student;
      const st = d.attendance?.status ?? status;
      setLog((prev) => [
        {
          id: `${Date.now()}-${stu.id}`,
          at: new Date().toISOString(),
          raw: code,
          name: stu.name,
          admission_number: stu.admission_number,
          status: st,
          ok: true,
        },
        ...prev,
      ].slice(0, 40));
      setScanInput("");
      void loadDay();
    } finally {
      setSubmitting(false);
      scanRef.current?.focus({ preventScroll: true });
    }
  }

  function onScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = scanInput.trim();
      if (!v) return;

      if (confirmBeforeSave) {
        const local = matchLocal(v);
        setPending({
          code: v,
          previewStudent: local ?? null,
        });
        setScanInput("");
        return;
      }

      void saveScan(v);
    }
  }

  function abortPending() {
    setPending(null);
    scanRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Barcode className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
          Barcode attendance
        </h3>
        <p className="text-sm text-muted-foreground">
          Use a handheld scanner or paste the barcode value. Matches <strong className="font-medium text-foreground">admission number</strong>, or encoded <code className="text-xs">SID:studentId</code>.
        </p>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/25 p-4 sm:p-5">
        <h4 className="text-sm font-semibold tracking-tight">Setup & workflow</h4>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
          <li>
            Encode each learner’s barcode with the exact <strong className="text-foreground">admission number</strong> listed for the class below (recommended: Code&nbsp;128 or Code&nbsp;39).
          </li>
          <li>
            Or print labels using <strong className="text-foreground">SID:«id»</strong> format (student record id shown in admissions data / API).
          </li>
          <li>Select the same class and session date as manual marking.</li>
          <li>Wedge scanners type into the capture field then send Enter.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="bc_class_id">Class</Label>
          <select
            id="bc_class_id"
            className="flex h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.section ? ` (${c.section})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bc_date">Date</Label>
          <Input
            id="bc_date"
            type="date"
            className="w-44"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bc_status">Default status on scan</Label>
          <select
            id="bc_status"
            className="flex h-9 w-44 rounded-md border border-input bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadDay()} disabled={loadingRows}>
          Reload roster
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="scan_input">Barcode capture</Label>
          <Input
            id="scan_input"
            ref={scanRef}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full border-2 font-mono text-base sm:text-lg tracking-wide",
              "border-indigo-500/35 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
            )}
            placeholder="Scan or paste, then Enter…"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={onScanKeyDown}
            disabled={submitting || !classId}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-indigo-600"
            checked={confirmBeforeSave}
            onChange={(e) => {
              setConfirmBeforeSave(e.target.checked);
              setPending(null);
            }}
          />
          Confirm before saving
        </label>
      </div>

      {pending && (
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-indigo-500/10 p-4 dark:bg-indigo-950/40">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Confirm attendance</p>
            <p>
              Raw code <code className="rounded bg-background px-1.5 py-0.5 text-xs">{pending.code}</code>
            </p>
            {pending.previewStudent ? (
              <p>
                Matched roster:{" "}
                <strong>{pending.previewStudent.name}</strong> ·{" "}
                {pending.previewStudent.admission_number}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Server will resolve this code against the roster (checks admission number and SID: format).
              </p>
            )}
            <p>
              Applied status:{" "}
              <span className="capitalize">{status}</span> · Day {date}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={abortPending}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600"
              onClick={() => {
                void (async () => {
                  await saveScan(pending.code);
                  setPending(null);
                })();
              }}
            >
              {submitting ? "Saving…" : "Confirm & save"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h4 className="text-sm font-medium">Barcode reference roster</h4>
          <Link
            href="/attendance/barcode-labels"
            className="text-xs font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
          >
            Open print-ready label sheet →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Labels should reproduce these admission codes exactly ({rows.length} students).
        </p>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission (encode this)</TableHead>
                <TableHead>Student ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!classId ? (
                <TableRow>
                  <TableCell colSpan={3}>Select a class.</TableCell>
                </TableRow>
              ) : loadingRows ? (
                <TableSkeletonRows columns={3} rows={8} />
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No enrolments for this class.</TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{r.admission_number}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      SID:{r.student_id}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {log.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Session log</h4>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Time</TableHead>
                  <TableHead>Raw</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((row) => (
                  <TableRow key={row.id} className={cn(!row.ok && "bg-destructive/5")}>
                    <TableCell className="tabular-nums text-muted-foreground text-xs">
                      {new Date(row.at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.raw}</TableCell>
                    <TableCell>
                      {row.ok ? (
                        <span>
                          {row.name}{" "}
                          <span className="text-muted-foreground text-xs">({row.admission_number})</span>
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-destructive text-sm",
                            row.message?.includes("\n") && "whitespace-pre-line"
                          )}
                        >
                          {row.message ?? "Failed"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
