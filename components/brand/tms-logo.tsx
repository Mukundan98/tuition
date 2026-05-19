"use client";

import Link from "next/link";
import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils";

type TmsLogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
};

/** Square app mark: Now using the brand logo image. */
export function TmsLogoMark({ className, size = 40, title = "Tuvo" }: TmsLogoMarkProps) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-xl", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/tuvo_logo.jpg"
        alt={title}
        fill
        className="object-cover"
        priority
      />
    </div>
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
  title = "Tuvo",
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
        TUVO
      </p>
      <p
        className={cn(
          "text-[11px] tracking-wide",
          variant === "sidebar" && "text-muted-foreground",
          variant === "auth" && "text-muted-foreground",
          variant === "inline" && "text-muted-foreground"
        )}
      >
        Management System
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

