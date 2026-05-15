"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "./dashboard-nav-config";

/** Only the most specific matching href is active (avoids /attendance + /attendance/barcode-labels both lit). */
function activeHrefSetForPath(
  pathname: string,
  visibleHrefs: readonly { href: string }[]
): Set<string> {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const candidates = visibleHrefs.filter(({ href }) => {
    const base =
      href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
    return path === base || path.startsWith(`${base}/`);
  });
  if (candidates.length === 0) return new Set();
  const maxLen = Math.max(...candidates.map((c) => c.href.length));
  return new Set(
    candidates.filter((c) => c.href.length === maxLen).map((c) => c.href)
  );
}

export function DashboardNavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, status } = useAuth();
  const slug = user?.role?.slug;

  const visible = useMemo(
    () =>
      dashboardNavItems.filter((i) => {
        const roleFilter = i.roles;
        const allowedByRole =
          !roleFilter || (slug && roleFilter.includes(slug));
        const hiddenForAdmin =
          slug === "admin" && (i.hideForRoles?.includes("admin") ?? false);
        return allowedByRole && !hiddenForAdmin;
      }),
    [slug]
  );

  const activeHrefSet = useMemo(
    () => activeHrefSetForPath(pathname, visible),
    [pathname, visible]
  );

  return (
    <>
      {status === "loading" && (
        <div className="space-y-1.5 px-1 py-0.5" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg bg-sidebar-accent/50 dark:bg-sidebar-accent/25"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {visible.map((item) => {
          const active = activeHrefSet.has(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  "group/nav flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-all duration-200",
                  "ring-sidebar-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]",
                  active
                    ? cn(
                        "bg-gradient-to-r from-indigo-500/14 via-violet-500/10 to-transparent",
                        "text-indigo-800 shadow-sm ring-1 ring-indigo-500/15 dark:from-indigo-400/20 dark:via-violet-500/12 dark:text-indigo-100 dark:ring-indigo-400/20",
                        "font-semibold"
                      )
                    : cn(
                        "text-sidebar-foreground/78 hover:bg-sidebar-accent/75 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/45"
                      )
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                    active
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 dark:from-indigo-500 dark:to-violet-500"
                      : "bg-sidebar-accent/70 text-sidebar-foreground/65 group-hover/nav:bg-sidebar-accent group-hover/nav:text-sidebar-foreground dark:bg-sidebar-accent/35"
                  )}
                >
                  <item.icon className="size-[15px] shrink-0" strokeWidth={active ? 2.25 : 2} />
                </span>
                <span className="min-w-0 truncate">{item.title}</span>
                {active ? (
                  <span
                    className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
