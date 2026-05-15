"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaginationBar } from "@/components/crud/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ListMeta, OnlineExamSummaryRow, SchoolClassRow } from "@/lib/types";
import { firstError } from "@/lib/types";

type ListPayload = { items: OnlineExamSummaryRow[]; meta: ListMeta };

export function OnlineExamsAdminListClient() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [newClassId, setNewClassId] = useState("");
  const [newTitle, setNewTitle] = useState("Untitled online exam");
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<ListPayload>(`online-exams?page=${page}&per_page=15`);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Failed to load.");
      setData(null);
      return;
    }
    setErr(null);
    setData(r.json.data);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=200");
      if (r.json?.success && r.json.data?.items) {
        setClasses(r.json.data.items);
        const first = r.json.data.items[0];
        if (first) setNewClassId(String(first.id));
      }
    })();
  }, []);

  async function createExam() {
    setCreateErr(null);
    const cid = Number(newClassId);
    if (!Number.isInteger(cid) || cid < 1) {
      setCreateErr("Pick a class.");
      return;
    }
    setCreatePending(true);
    const r = await apiJson<{ exam: { id: number } }>("online-exams", "POST", {
      class_id: cid,
      title: newTitle.trim() || "Untitled online exam",
      is_published: false,
    });
    setCreatePending(false);
    if (!r.ok || !r.json?.success || !r.json.data?.exam) {
      setCreateErr(firstError(r.json?.errors) ?? r.json?.message ?? "Create failed.");
      return;
    }
    setCreateOpen(false);
    window.location.href = `/online-exams/manage/${r.json.data.exam.id}`;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Online exams</h2>
          <p className="text-sm text-muted-foreground">
            Build MCQ exams per class, publish when ready, then review marks and question-level analysis.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New online exam
          </Button>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline self-center">
            ← Dashboard
          </Link>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-center">Qs</TableHead>
              <TableHead className="text-center">Attempts</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data && <TableSkeletonRows columns={6} rows={6} lastColumnRight />}
            {data && data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No online exams yet.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.school_class?.name ?? "—"}
                  {row.school_class?.section ? ` (${row.school_class.section})` : ""}
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.questions_count}</TableCell>
                <TableCell className="text-center tabular-nums">{row.attempts_count}</TableCell>
                <TableCell>{row.is_published ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/online-exams/manage/${row.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Manage
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && data.meta.last_page > 1 && (
          <PaginationBar meta={data.meta} onPage={setPage} />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New online exam</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {createErr && <p className="text-sm text-destructive">{createErr}</p>}
            <div className="space-y-2">
              <Label>Class</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newClassId}
                onChange={(e) => setNewClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.section ? ` (${c.section})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={createPending} onClick={() => void createExam()}>
              {createPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
