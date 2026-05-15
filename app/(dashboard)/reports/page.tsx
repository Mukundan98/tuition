"use client";

import Link from "next/link";
import {
  FileSpreadsheet,
  Receipt,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const adminLinks = [
  {
    title: "Attendance report",
    href: "/attendance/report",
    description: "Filter by range, review daily marks, export PDF or CSV.",
    icon: FileSpreadsheet,
  },
  {
    title: "Fees report",
    href: "/fees/report",
    description: "Paid vs outstanding with filters and CSV export.",
    icon: Receipt,
  },
  {
    title: "Exams",
    href: "/exams",
    description: "Mark sheets, bulk results, and report cards.",
    icon: ScrollText,
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const admin = user?.role?.slug === "admin";

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports hub</CardTitle>
            <CardDescription>
              Detailed exports and fee reports are available to administrators.
              You can still open your personal alerts from the sidebar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Reports hub</h2>
        <p className="text-sm text-muted-foreground">
          Quick entry points for operational exports and exam workflows.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-1">
        {adminLinks.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <Card className="transition-colors hover:border-indigo-300/50 hover:bg-accent/30">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
