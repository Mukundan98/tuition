"use client";

import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function MustChangePasswordGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user?.must_change_password) return;
    if (pathname === "/profile" || pathname.startsWith("/profile/")) return;
    router.replace("/profile");
  }, [status, user, pathname, router]);

  return <>{children}</>;
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);

  if (status === "loading") {
    return <AppPageLoader variant="fullscreen" />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar mode="desktop" />
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent
          side="left"
          showCloseButton
          className="w-[min(100%,18rem)] border-r p-0 sm:max-w-xs"
        >
          <AppSidebar mode="drawer" onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          prepend={
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNav(true)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0 lg:hidden"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          }
        />
        <main className="flex-1 overflow-y-auto">
          <MustChangePasswordGate>{children}</MustChangePasswordGate>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  );
}
