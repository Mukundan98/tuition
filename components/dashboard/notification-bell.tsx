"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, apiJson } from "@/lib/api";
import type { InAppNotificationRow } from "@/lib/types";

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<InAppNotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<{ items: InAppNotificationRow[]; unread_count: number }>(
      "in-app-notifications/dropdown"
    );
    if (r.json?.success && r.json.data) {
      setItems(r.json.data.items);
      setUnread(r.json.data.unread_count);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  async function markRead(n: InAppNotificationRow) {
    if (n.read_at) return;
    await apiJson(`in-app-notifications/${n.id}/read`, "PATCH");
    void load();
  }

  async function markAll() {
    await apiJson("in-app-notifications/mark-all-read", "POST");
    void load();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative h-10 w-10")}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-normal text-indigo-600 hover:underline"
                onClick={() => void markAll()}
              >
                Mark all read
              </button>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">No alerts yet.</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-3"
              onClick={() => void markRead(n)}
            >
              <span className="font-medium leading-tight">{n.title}</span>
              <span className="text-xs font-normal text-muted-foreground line-clamp-2">{n.body}</span>
              {!n.read_at && (
                <span className="text-[10px] text-indigo-600">Tap to mark read</span>
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="w-full justify-center text-center text-indigo-600"
          onClick={() => {
            setOpen(false);
            router.push("/notifications");
          }}
        >
          View all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
