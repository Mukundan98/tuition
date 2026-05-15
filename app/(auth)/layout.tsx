import { TmsLogoFull } from "@/components/brand/tms-logo";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa] dark:bg-zinc-950 font-sans tracking-tight selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
        <header className="mb-10 text-center space-y-4">
          <TmsLogoFull variant="auth" markSize={48} href="/" className="mx-auto" />
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <Sparkles className="size-3 text-indigo-500" />
            TMS &bull; Management Suite
          </div>
        </header>

        <main className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </main>

        <footer className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="h-px w-12 bg-border/40" />
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} TMS &bull; SECURED WITH SANCTUM
          </p>
        </footer>
      </div>
    </div>
  );
}

