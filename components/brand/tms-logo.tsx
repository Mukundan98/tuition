"use client";

import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

type TmsLogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
};

/** Square app mark: gradient tile + open-book symbol (reads well down to favicon size). */
export function TmsLogoMark({ className, size = 40, title = "Tuition Management System" }: TmsLogoMarkProps) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`${gid}-bg`} x1="4" y1="3" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gid}-bg)`} />
      <path
        fill="#fff"
        fillOpacity={0.94}
        d="M8 10.5 L16 8 L16 24 L8 26.5 Z M16 8 L24 10.5 L24 26.5 L16 24 Z"
      />
      <path
        stroke="#fff"
        strokeOpacity={0.35}
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M16 8v16.5"
      />
    </svg>
  );
}

type TmsLogoFullProps = {
  className?: string;
  markSize?: number;
  /** Sidebar: use light text. Auth hero: use gradient wordmark. */
  variant?: "sidebar" | "auth" | "inline";
  href?: string;
  title?: string;
};

export function TmsLogoFull({
  className,
  markSize = 40,
  variant = "inline",
  href,
  title = "Tuition Management System",
}: TmsLogoFullProps) {
  const wordmark = (
    <div className="min-w-0 leading-tight">
      <p
        className={cn(
          "font-heading text-[0.95rem] font-bold tracking-tight sm:text-base",
          variant === "auth" &&
            "bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-cyan-400",
          variant === "sidebar" && "text-sidebar-foreground",
          variant === "inline" && "text-foreground"
        )}
      >
        TMS
      </p>
      <p
        className={cn(
          "text-[11px] tracking-wide",
          variant === "sidebar" && "text-muted-foreground",
          variant === "auth" && "text-muted-foreground",
          variant === "inline" && "text-muted-foreground"
        )}
      >
        Tuition Management
      </p>
    </div>
  );

  const inner = (
    <>
      <TmsLogoMark size={markSize} title={title} />
      {wordmark}
    </>
  );

  const wrapClass = cn("flex items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={cn(wrapClass, "rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500")}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapClass}>{inner}</div>;
}
