import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Tuition Management System",
    template: "%s | TMS",
  },
  description: "Tuition center operations platform",
  icons: {
    icon: [{ url: "/brand/tms-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/tms-mark.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", inter.variable)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
