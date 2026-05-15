"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { apiFetch } from "@/lib/api";
import type { GlobalSearchResults } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();
  const admin = user?.role?.slug === "admin";

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GlobalSearchResults | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const r = await apiFetch<GlobalSearchResults>(
      `search?q=${encodeURIComponent(term.trim())}`
    );
    if (r.json?.success && r.json.data) {
      setData(r.json.data);
    } else {
      setData({ students: [], teachers: [], classes: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || !admin) {
      return;
    }
    const t = window.setTimeout(() => void runSearch(q), 280);
    return () => window.clearTimeout(t);
  }, [q, open, admin, runSearch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (admin) {
          setOpen((o) => !o);
        }
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [admin]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQ("");
      setData(null);
    }
  }, [open]);

  if (!admin) {
    return null;
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "hidden h-9 gap-2 text-muted-foreground sm:inline-flex"
        )}
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "sm:hidden"
        )}
      >
        <Search className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
          role="dialog"
          aria-modal
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search students, teachers, classes…"
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2 text-sm">
              {loading ? (
                <p className="px-2 py-4 text-muted-foreground">
                  Searching…
                </p>
              ) : q.trim().length < 2 ? (
                <p className="px-2 py-4 text-muted-foreground">
                  Type at least two characters.
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.students && data.students.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                        Students
                      </p>
                      <ul>
                        {data.students.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => go(`/students/${s.id}`)}
                              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
                            >
                              <span className="font-medium">{s.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                                {s.admission_number}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data?.teachers && data.teachers.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                        Teachers
                      </p>
                      <ul>
                        {data.teachers.map((t) => (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => go(`/teachers/${t.id}`)}
                              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
                            >
                              <span className="font-medium">
                                {t.name ?? "—"}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                                {t.employee_id}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data?.classes && data.classes.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                        Classes
                      </p>
                      <ul>
                        {data.classes.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => go(`/classes/${c.id}`)}
                              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
                            >
                              <span className="font-medium">{c.name}</span>
                              {c.section ? (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {c.section}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data &&
                    !data.students.length &&
                    !data.teachers.length &&
                    !data.classes.length && (
                      <p className="px-2 py-4 text-muted-foreground">
                        No matches.
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
