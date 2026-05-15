"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaginationBar } from "@/components/crud/pagination-bar";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { FeeForm } from "@/components/fees/fee-form";
import { apiFetch, apiJson } from "@/lib/api";
import { firstError } from "@/lib/types";
import type { FeeDetail, FeeOverviewStats, FeeRow, ListMeta } from "@/lib/types";

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

export function FeesListClient({ initialStatus }: { initialStatus?: string }) {
  const [overview, setOverview] = useState<FeeOverviewStats | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeeRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFee, setEditFee] = useState<FeeDetail | null>(null);
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FeeRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<FeeOverviewStats>("fees/overview");
      if (r.json?.success && r.json.data) {
        setOverview(r.json.data);
      }
    })();
  }, [listVersion]);

  useEffect(() => {
    setStatus(initialStatus ?? "");
    setPage(1);
  }, [initialStatus]);

  const load = useCallback(async () => {
    void listVersion;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "15" });
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    const r = await apiFetch<{ items: FeeRow[]; meta: ListMeta }>(`fees?${qs}`);
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
  }, [page, q, status, listVersion]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editId == null) {
      setEditFee(null);
      setEditLoadErr(null);
      return;
    }
    let alive = true;
    setEditLoading(true);
    setEditLoadErr(null);
    void (async () => {
      const r = await apiFetch<{ fee: FeeDetail }>(`fees/${editId}`);
      if (!alive) return;
      if (!r.ok || !r.json?.success || !r.json.data?.fee) {
        setEditLoadErr(r.json?.message ?? "Not found");
        setEditFee(null);
        setEditLoading(false);
        return;
      }
      setEditFee(r.json.data.fee);
      setEditLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [editId]);

  function refreshOverview() {
    void (async () => {
      const r = await apiFetch<FeeOverviewStats>("fees/overview");
      if (r.json?.success && r.json.data) setOverview(r.json.data);
    })();
  }

  function bumpList() {
    setListVersion((v) => v + 1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    setDeleteErr(null);
    const r = await apiJson(`fees/${deleteTarget.id}`, "DELETE");
    setDeletePending(false);
    if (!r.ok || !r.json?.success) {
      setDeleteErr(
        firstError(r.json?.errors as Record<string, string[]> | undefined) ??
          r.json?.message ??
          "Delete failed"
      );
      return;
    }
    setDeleteTarget(null);
    bumpList();
    refreshOverview();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Fees</h2>
          <p className="text-sm text-muted-foreground">Charges, balances, and payment intake.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New fee
        </Button>
      </div>

      {overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
            <p className="text-2xl font-semibold tabular-nums">{overview.pending_balance}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Fees with balance</p>
            <p className="text-2xl font-semibold tabular-nums">{overview.fees_with_balance}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-semibold tabular-nums text-rose-700">
              {overview.overdue_count}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Paid this month</p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-700">
              {overview.paid_this_month}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/fees/report" className="text-indigo-600 hover:underline">
          Payment report →
        </Link>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            refreshOverview();
            void load();
          }}
        >
          Refresh stats
        </button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setPage(1);
          setQ(String(fd.get("qq") ?? ""));
          setStatus(String(fd.get("fee_status") ?? ""));
        }}
      >
        <Input name="qq" placeholder="Student or title…" className="max-w-xs" defaultValue={q} />
        <select
          name="fee_status"
          className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
          defaultValue={status}
        >
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Due amt</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableSkeletonRows columns={8} leadCell="double" lastColumnRight />
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>No fees.</TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.student?.name ?? "—"}
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                      {row.student?.admission_number}
                    </span>
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.due_date}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.paid_total}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.balance}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${badgeClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-3 whitespace-nowrap">
                    <Link href={`/fees/${row.id}`} className="text-sm text-indigo-600 hover:underline">
                      Open
                    </Link>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={() => setEditId(row.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm text-destructive hover:underline"
                      onClick={() => {
                        setDeleteErr(null);
                        setDeleteTarget(row);
                      }}
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {meta && meta.last_page > 1 && !loading && (
          <PaginationBar meta={meta} onPage={setPage} />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New fee</DialogTitle>
            <DialogDescription>Issue a fee charge to a student.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FeeForm
              mode="create"
              variant="dialog"
              onCancel={() => setCreateOpen(false)}
              onSaved={() => {
                setCreateOpen(false);
                bumpList();
                refreshOverview();
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={editId != null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit fee</DialogTitle>
            <DialogDescription>Update title, amount, or due date.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {editLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {editLoadErr && <p className="text-sm text-destructive">{editLoadErr}</p>}
            {!editLoading && editFee && editId != null && (
              <FeeForm
                key={editId}
                mode="edit"
                feeId={editId}
                defaultEdit={{
                  title: editFee.title,
                  notes: editFee.notes ?? "",
                  amount: editFee.amount,
                  due_date: editFee.due_date,
                }}
                variant="dialog"
                onCancel={() => setEditId(null)}
                onSaved={() => {
                  setEditId(null);
                  bumpList();
                  refreshOverview();
                }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteErr(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fee record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove “${deleteTarget.title}” for ${deleteTarget.student?.name ?? "student"}. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErr && <p className="px-6 pb-2 text-sm text-destructive">{deleteErr}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
              disabled={deletePending}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
