"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  FileSpreadsheet,
  Receipt,
  ScrollText,
  Table2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import {
  ReportsHubChart,
  type ReportChartKind,
  type ReportDataKind,
} from "@/components/reports/reports-hub-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DashboardAdminStats } from "@/lib/types";

type HubTab = "table" | "charts";

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
] as const;

const reportTypeOptions: { value: ReportDataKind; label: string }[] = [
  { value: "attendance", label: "Attendance" },
  { value: "fees", label: "Fees" },
  { value: "exams", label: "Exams" },
  { value: "others", label: "Others" },
];

const chartTypeOptions: { value: ReportChartKind; label: string }[] = [
  { value: "pie", label: "Pie chart" },
  { value: "donut", label: "Donut chart" },
  { value: "bar", label: "Bar chart" },
  { value: "line", label: "Line chart" },
  { value: "area", label: "Area chart" },
  { value: "radialBar", label: "Radial bar" },
  { value: "polarArea", label: "Polar area" },
];

const hubTabs: { key: HubTab; label: string; Icon: typeof Table2 }[] = [
  { key: "table", label: "Table", Icon: Table2 },
  { key: "charts", label: "Charts", Icon: BarChart3 },
];

const selectClassName =
  "flex h-9 w-full min-w-[10rem] rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function ReportsPageClient() {
  const { user } = useAuth();
  const admin = user?.role?.slug === "admin";

  const [tab, setTab] = useState<HubTab>("table");
  const [stats, setStats] = useState<DashboardAdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [reportType, setReportType] = useState<ReportDataKind>("attendance");
  const [chartType, setChartType] = useState<ReportChartKind>("pie");
  const [applied, setApplied] = useState<{
    report: ReportDataKind;
    chart: ReportChartKind;
  } | null>(null);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    void (async () => {
      const r = await apiFetch<DashboardAdminStats>("dashboard/admin");
      if (cancelled) return;
      if (r.json?.success && r.json.data) {
        setStats(r.json.data);
        setStatsError(null);
      } else {
        setStats(null);
        setStatsError("Could not load chart data.");
      }
      setStatsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [admin]);

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports hub</CardTitle>
            <CardDescription>
              Detailed exports and fee reports are available to administrators. You can still open
              your personal alerts from the sidebar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const appliedReportLabel =
    reportTypeOptions.find((o) => o.value === applied?.report)?.label ?? "";
  const appliedChartLabel =
    chartTypeOptions.find((o) => o.value === applied?.chart)?.label ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Reports hub</h2>
        <p className="text-sm text-muted-foreground">
          Quick entry points for operational exports and exam workflows.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Reports view"
        className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-1"
      >
        {hubTabs.map(({ key, label, Icon }) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "table" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Available reports</CardTitle>
            <CardDescription>Open a report to filter, review, and export.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Report</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminLinks.map((item) => (
                  <TableRow key={item.href}>
                    <TableCell className="pl-6 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                          <item.icon className="size-4" aria-hidden />
                        </span>
                        {item.title}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal text-muted-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={item.href}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
                      >
                        Open
                        <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Chart builder</CardTitle>
              <CardDescription>
                Choose a report and ApexCharts type, then apply to preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="grid w-full gap-2 sm:max-w-[12rem]">
                  <Label htmlFor="report-type">Report type</Label>
                  <select
                    id="report-type"
                    className={selectClassName}
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportDataKind)}
                  >
                    {reportTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid w-full gap-2 sm:max-w-[12rem]">
                  <Label htmlFor="chart-type">Chart type</Label>
                  <select
                    id="chart-type"
                    className={selectClassName}
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ReportChartKind)}
                  >
                    {chartTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  className="sm:mb-0.5"
                  onClick={() => setApplied({ report: reportType, chart: chartType })}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
              {applied ? (
                <CardDescription>
                  {appliedReportLabel} · {appliedChartLabel}
                </CardDescription>
              ) : (
                <CardDescription>Select options above and click Apply.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!applied ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No chart generated yet.
                </p>
              ) : statsLoading ? (
                <Skeleton className="h-[320px] w-full rounded-lg" />
              ) : statsError ? (
                <p className="py-10 text-center text-sm text-destructive">{statsError}</p>
              ) : stats ? (
                <ReportsHubChart
                  key={`${applied.report}-${applied.chart}`}
                  stats={stats}
                  report={applied.report}
                  chartKind={applied.chart}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
