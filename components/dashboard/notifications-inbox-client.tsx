"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { apiFetch, apiJson } from "@/lib/api";
import type { InAppNotificationRow, ListMeta } from "@/lib/types";

export function NotificationsInboxClient() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<InAppNotificationRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "15" });
    if (tab === "unread") qs.set("unread_only", "1");
    const r = await apiFetch<{
      items: InAppNotificationRow[];
      meta: ListMeta;
      unread_count: number;
    }>(`in-app-notifications?${qs}`);
    setLoading(false);
    if (r.json?.success && r.json.data) {
      setItems(r.json.data.items);
      setMeta(r.json.data.meta);
      setUnreadTotal(r.json.data.unread_count);
    }
  }, [page, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function readOne(id: number) {
    await apiJson(`in-app-notifications/${id}/read`, "PATCH");
    void load();
  }

  async function readAll() {
    await apiJson("in-app-notifications/mark-all-read", "POST");
    void load();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {unreadTotal} unread · stays in-app (no Laravel mail conflict).
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
        >
          All
        </Button>
        <Button
          type="button"
          variant={tab === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("unread")}
        >
          Unread
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void readAll()}>
          Mark all read
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Body</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeletonRows columns={4} lastColumnRight />}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Nothing here.</TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((n) => (
                <TableRow key={n.id} className={n.read_at ? "" : "bg-indigo-50/60 dark:bg-indigo-950/20"}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {new Date(n.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell className="max-w-md text-muted-foreground text-sm">{n.body}</TableCell>
                  <TableCell className="text-right">
                    {!n.read_at && (
                      <Button type="button" variant="outline" size="sm" onClick={() => void readOne(n.id)}>
                        Read
                      </Button>
                    )}
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
