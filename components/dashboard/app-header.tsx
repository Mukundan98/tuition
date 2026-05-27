"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LogOut, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-context";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  prepend?: ReactNode;
};

export function AppHeader({ prepend }: AppHeaderProps) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-300">
          <div className="relative mb-6 h-20 w-40 overflow-hidden rounded-xl bg-white/50 p-2 shadow-2xl backdrop-blur-sm ring-1 ring-white/20">
            <Image
              src="/brand/tuvo_logo.jpg"
              alt="Tuvo Logo"
              fill
              className="object-contain mix-blend-multiply"
              priority
            />
          </div>
          <Loader2 className="h-12 w-12 animate-spin text-primary shadow-sm" />
          <p className="mt-4 animate-pulse text-xl font-semibold tracking-tight text-foreground">
            Logging out...
          </p>
        </div>
      )}
      <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden sm:px-6">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
          {prepend ?? null}
          <div className="min-w-0 flex-1">

            <h1 className="text-lg text-muted-foreground font-bold">
              Welcome back
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {status === "authed" && user && (
            <>
              <ThemeToggle />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-lg" }),
                    "relative h-10 w-10 shrink-0 rounded-full"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                        {user.role && (
                          <span className="text-xs capitalize text-indigo-600 dark:text-indigo-400">
                            {user.role.name}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void (async () => {
                        setIsLoggingOut(true);
                        await logout();
                        window.location.replace("/login");
                      })();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>
    </>
  );
}
