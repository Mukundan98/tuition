
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


        <main className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </main>


      </div>
    </div>
  );
}

