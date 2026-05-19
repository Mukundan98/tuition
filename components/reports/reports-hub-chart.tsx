"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import type { DashboardAdminStats } from "@/lib/types";

const CHART_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#fb7185", "#8b5cf6", "#0ea5e9"];

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return <div className="h-[320px] animate-pulse rounded-lg bg-muted/50" />;
}

export type ReportChartKind =
  | "pie"
  | "donut"
  | "bar"
  | "line"
  | "area"
  | "radialBar"
  | "polarArea";

export type ReportDataKind = "attendance" | "fees" | "exams" | "others";

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return { dark, mounted };
}

function attendanceTotals(stats: DashboardAdminStats) {
  let present = 0;
  let absent = 0;
  for (const s of stats.attendance_series) {
    present += s.present;
    absent += Math.max(0, s.marked - s.present);
  }
  return { present, absent };
}

function reportDataset(
  report: ReportDataKind,
  stats: DashboardAdminStats
): { labels: string[]; values: number[]; title: string } {
  switch (report) {
    case "attendance": {
      const { present, absent } = attendanceTotals(stats);
      return {
        labels: ["Present", "Absent / unmarked"],
        values: [present, absent],
        title: "Attendance summary",
      };
    }
    case "fees": {
      const f = stats.fee_summary;
      return {
        labels: ["Pending balance", "Paid this month", "Unpaid records"],
        values: [
          Number(f.pending_balance) || 0,
          Number(f.paid_this_month) || 0,
          Number(f.unpaid_fee_records) || 0,
        ],
        title: "Fees overview",
      };
    }
    case "exams":
      return {
        labels: ["Upcoming exams", "Students", "Classes", "Subjects"],
        values: [
          stats.exams_upcoming,
          stats.students_count,
          stats.classes_count,
          stats.subjects_count,
        ],
        title: "Exams & academics",
      };
    case "others":
    default:
      return {
        labels: ["Students", "Teachers", "Classes", "Subjects"],
        values: [
          stats.students_count,
          stats.teachers_count,
          stats.classes_count,
          stats.subjects_count,
        ],
        title: "Institution overview",
      };
  }
}

function sharedChart(dark: boolean) {
  const labelColor = dark ? "#a1a1aa" : "#71717a";
  return {
    labelColor,
    chart: {
      fontFamily: "inherit",
      background: "transparent" as const,
      foreColor: labelColor,
      toolbar: { show: false },
      animations: { enabled: true, speed: 450 },
    },
    colors: CHART_COLORS,
    legend: {
      position: "bottom" as const,
      fontSize: "12px",
      labels: { colors: dark ? "#e4e4e7" : "#3f3f46" },
    },
    tooltip: { theme: (dark ? "dark" : "light") as "dark" | "light" },
  };
}

function buildOptions(
  chartKind: ReportChartKind,
  dark: boolean,
  labels: string[],
  categories: string[]
): ApexOptions {
  const { labelColor, chart, colors, legend, tooltip } = sharedChart(dark);
  const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  if (chartKind === "donut") {
    return {
      chart: { ...chart, type: "donut" },
      labels,
      colors,
      legend,
      tooltip,
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              name: { color: labelColor },
              value: {
                color: dark ? "#fafafa" : "#18181b",
                fontSize: "18px",
                fontWeight: 600,
              },
              total: {
                show: true,
                label: "Total",
                color: labelColor,
              },
            },
          },
        },
      },
      stroke: { width: 0 },
      dataLabels: { enabled: false },
    };
  }

  if (chartKind === "pie") {
    return {
      chart: { ...chart, type: "pie" },
      labels,
      colors,
      legend,
      tooltip,
      dataLabels: {
        enabled: true,
        style: { fontSize: "11px", fontWeight: 600 },
      },
      stroke: { width: 2, colors: [dark ? "#fafafa" : "#ffffff"] },
    };
  }

  if (chartKind === "polarArea") {
    return {
      chart: { ...chart, type: "polarArea" },
      labels,
      colors,
      legend,
      tooltip,
      stroke: { width: 1, colors: [dark ? "#fafafa" : "#ffffff"] },
      fill: { opacity: 0.85 },
    };
  }

  if (chartKind === "radialBar") {
    return {
      chart: { ...chart, type: "radialBar" },
      labels,
      colors,
      legend,
      tooltip,
      plotOptions: {
        radialBar: {
          hollow: { size: "42%" },
          dataLabels: {
            name: { fontSize: "12px", color: labelColor },
            value: {
              fontSize: "16px",
              fontWeight: 600,
              color: dark ? "#fafafa" : "#18181b",
            },
            total: {
              show: true,
              label: "Total",
              color: labelColor,
            },
          },
        },
      },
      stroke: { lineCap: "round" },
    };
  }

  const cartesianType = chartKind;
  const opts: ApexOptions = {
    chart: { ...chart, type: cartesianType, zoom: { enabled: false } },
    colors,
    legend,
    tooltip,
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px", colors: labelColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { fontSize: "11px", colors: labelColor } },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    dataLabels: { enabled: chartKind === "bar" },
  };

  if (chartKind === "bar") {
    opts.plotOptions = {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "55%",
      },
    };
    opts.stroke = { show: true, width: 2, colors: ["transparent"] };
  }

  if (chartKind === "line" || chartKind === "area") {
    opts.stroke = {
      curve: "smooth",
      width: 2.5,
    };
  }

  if (chartKind === "area") {
    opts.fill = {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.35,
        opacityFrom: 0.55,
        opacityTo: 0.08,
      },
    };
  }

  return opts;
}

type Props = {
  stats: DashboardAdminStats;
  report: ReportDataKind;
  chartKind: ReportChartKind;
};

export function ReportsHubChart({ stats, report, chartKind }: Props) {
  const { dark, mounted } = useChartTheme();

  const { labels, values, title } = useMemo(
    () => reportDataset(report, stats),
    [report, stats]
  );

  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

  const { options, series, apexType } = useMemo(() => {
    const opts = buildOptions(chartKind, dark, labels, labels);

    const isCircular =
      chartKind === "pie" ||
      chartKind === "donut" ||
      chartKind === "polarArea" ||
      chartKind === "radialBar";

    if (isCircular) {
      return {
        options: opts,
        series: values,
        apexType: chartKind === "donut" ? "donut" : chartKind,
      };
    }

    return {
      options: opts,
      series: [{ name: title, data: values }],
      apexType: chartKind,
    };
  }, [chartKind, dark, labels, title, values]);

  if (!mounted) {
    return <ChartSkeleton />;
  }

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No data available for this report yet.
      </p>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type={apexType}
      height={320}
      width="100%"
    />
  );
}
