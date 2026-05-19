import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Tuvo Management System",
    template: "%s | Tuvo",
  },
  description: "Tuition center operations platform",
  icons: {
    icon: [{ url: "/brand/tuvo_logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/tuvo_logo.jpg", type: "image/jpeg" }],
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
