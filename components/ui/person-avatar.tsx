"use client";

import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export type PersonKind = "student" | "teacher";

const sizeClasses = {
  sm: "h-8 w-8 min-h-8 min-w-8 text-[10px] ring-1",
  md: "h-10 w-10 min-h-10 min-w-10 text-xs",
  lg: "h-20 w-20 min-h-20 min-w-20 text-lg ring-2",
  xl: "h-24 w-24 min-h-24 min-w-24 text-xl ring-2",
} as const;

const gradientByKind: Record<PersonKind, string> = {
  student: "bg-gradient-to-br from-sky-500 to-indigo-600",
  teacher: "bg-gradient-to-br from-violet-600 to-fuchsia-600",
};

export function PersonAvatar({
  name,
  photoUrl,
  kind,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  kind: PersonKind;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-border",
        sizeClasses[size],
        className
      )}
    >
      {photoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- uploaded profile URL */
        <img src={photoUrl} alt={`${name} profile`} className="h-full w-full object-cover" />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold text-white shadow-inner",
            gradientByKind[kind]
          )}
          aria-hidden
        >
          {initialsFromName(name)}
        </div>
      )}
    </div>
  );
}
