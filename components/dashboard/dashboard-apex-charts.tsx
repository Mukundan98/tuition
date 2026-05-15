"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import type { AttendanceSeriesPoint, DashboardAdminStats } from "@/lib/types";

type AdminOverviewPieStats = Pick<
  DashboardAdminStats,
  "students_count" | "teachers_count" | "classes_count" | "subjects_count" | "exams_upcoming"
>;

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-lg bg-muted/50" />,
});

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return { dark, mounted };
}

/** Grouped columns: records marked vs present per day. */
export function AttendanceBarChart({ series }: { series: AttendanceSeriesPoint[] }) {
  const { dark, mounted } = useChartTheme();

  const { options, chartSeries } = useMemo(() => {
    const labelColor = dark ? "#a1a1aa" : "#71717a";
    const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    const optionsInner: ApexOptions = {
      chart: {
        type: "bar",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        foreColor: labelColor,
        background: "transparent",
        animations: { enabled: true, speed: 400 },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          columnWidth: "62%",
          dataLabels: { position: "top" },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: series.map((s) => {
          const d = s.date;
          return d.length >= 10 ? d.slice(5, 10) : d;
        }),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { fontSize: "11px", colors: labelColor },
        },
      },
      yaxis: {
        labels: { style: { fontSize: "11px", colors: labelColor } },
        title: {
          text: "Count",
          style: { color: labelColor, fontSize: "11px" },
        },
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        padding: { left: 8, right: 8 },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
        labels: { colors: dark ? "#e4e4e7" : "#3f3f46" },
      },
      colors: ["#0d9488", "#6366f1"],
      tooltip: {
        theme: dark ? "dark" : "light",
        shared: true,
        intersect: false,
        y: {
          formatter(val: number) {
            return String(Math.round(val));
          },
        },
      },
    };

    const chartSeriesInner = [
      { name: "Marked", data: series.map((s) => s.marked) },
      { name: "Present", data: series.map((s) => s.present) },
    ];

    return { options: optionsInner, chartSeries: chartSeriesInner };
  }, [series, dark]);

  if (!mounted) {
    return <div className="h-[280px] animate-pulse rounded-lg bg-muted/50" />;
  }

  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No attendance data for this period.
      </p>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={chartSeries}
      type="bar"
      height={280}
      width="100%"
    />
  );
}

/** Donut: share of present vs absent across the series window. */
export function PresenceMixDonut({ series }: { series: AttendanceSeriesPoint[] }) {
  const { dark, mounted } = useChartTheme();

  const { totalPresent, totalAbsent } = useMemo(() => {
    let p = 0;
    let a = 0;
    for (const s of series) {
      p += s.present;
      a += Math.max(0, s.marked - s.present);
    }
    return { totalPresent: p, totalAbsent: a };
  }, [series]);

  const options: ApexOptions = useMemo(() => {
    const labelColor = dark ? "#a1a1aa" : "#71717a";
    return {
      chart: {
        type: "donut",
        fontFamily: "inherit",
        background: "transparent",
        animations: { enabled: true, speed: 450 },
      },
      labels: ["Present", "Absent / unmarked"],
      colors: ["#14b8a6", dark ? "#52525b" : "#cbd5e1"],
      legend: {
        position: "bottom",
        fontSize: "12px",
        labels: { colors: dark ? "#e4e4e7" : "#3f3f46" },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: { color: labelColor },
              value: {
                color: dark ? "#fafafa" : "#18181b",
                fontSize: "22px",
                fontWeight: 600,
                formatter(val: string) {
                  return val;
                },
              },
              total: {
                show: true,
                label: "Total marks",
                color: labelColor,
                formatter() {
                  return String(totalPresent + totalAbsent);
                },
              },
            },
          },
        },
      },
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      tooltip: {
        theme: dark ? "dark" : "light",
        y: {
          formatter(val: number) {
            return `${val} records`;
          },
        },
      },
    };
  }, [dark, totalPresent, totalAbsent]);

  if (!mounted) {
    return <div className="h-[260px] animate-pulse rounded-lg bg-muted/50" />;
  }

  const sum = totalPresent + totalAbsent;
  if (sum === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No marked sessions yet.</p>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={[totalPresent, totalAbsent]}
      type="donut"
      height={260}
      width="100%"
    />
  );
}

type FeeSummary = {
  pending_balance: number;
  unpaid_fee_records: number;
  paid_this_month: number;
};

/** Column chart: pending balance vs paid this month (same currency). */
export function FeeCurrencyColumnChart({ summary }: { summary: FeeSummary }) {
  const { dark, mounted } = useChartTheme();

  const pending = Number(summary.pending_balance) || 0;
  const paid = Number(summary.paid_this_month) || 0;

  const options: ApexOptions = useMemo(() => {
    const labelColor = dark ? "#a1a1aa" : "#71717a";
    const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "inherit",
        foreColor: labelColor,
        background: "transparent",
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 8,
          columnWidth: "45%",
          distributed: true,
        },
      },
      colors: ["#6366f1", "#14b8a8"],
      dataLabels: {
        enabled: true,
        offsetY: -18,
        style: {
          fontSize: "11px",
          colors: [dark ? "#fafafa" : "#18181b"],
        },
        formatter(val: number) {
          return val.toFixed(0);
        },
      },
      xaxis: {
        categories: ["Pending balance", "Paid this month"],
        labels: { style: { fontSize: "11px", colors: labelColor } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { fontSize: "11px", colors: labelColor } },
      },
      grid: { borderColor: gridColor, strokeDashArray: 4 },
      legend: { show: false },
      tooltip: {
        theme: dark ? "dark" : "light",
        y: {
          formatter(val: number) {
            return String(val.toFixed(2));
          },
        },
      },
    };
  }, [dark]);

  const chartSeries = [
    {
      name: "Amount",
      data: [pending, paid],
    },
  ];

  if (!mounted) {
    return <div className="h-[180px] animate-pulse rounded-lg bg-muted/50" />;
  }

  return (
    <ReactApexChart options={options} series={chartSeries} type="bar" height={180} width="100%" />
  );
}

/** Pie chart: share of live counts (students, teachers, classes, subjects, upcoming exams). */
export function AdminOverviewPieChart({ stats }: { stats: AdminOverviewPieStats }) {
  const { dark, mounted } = useChartTheme();

  const labels = useMemo(
    () => ["Students", "Teachers", "Classes", "Subjects", "Upcoming exams"],
    []
  );

  const seriesValues = useMemo(
    () => [
      stats.students_count,
      stats.teachers_count,
      stats.classes_count,
      stats.subjects_count,
      stats.exams_upcoming,
    ],
    [
      stats.students_count,
      stats.teachers_count,
      stats.classes_count,
      stats.subjects_count,
      stats.exams_upcoming,
    ]
  );

  const total = useMemo(() => seriesValues.reduce((a, b) => a + b, 0), [seriesValues]);

  const options: ApexOptions = useMemo(() => {
    return {
      chart: {
        type: "pie",
        fontFamily: "inherit",
        background: "transparent",
        toolbar: { show: false },
        animations: { enabled: true, speed: 450 },
      },
      labels,
      /* Cohesive teal / indigo / amber palette */
      colors: ["#6366f1", "#14b8a8", "#f59e0b", "#fb7185", "#8b5cf6"],
      legend: {
        position: "bottom",
        fontSize: "12px",
        labels: { colors: dark ? "#e4e4e7" : "#3f3f46" },
      },
      dataLabels: {
        enabled: true,
        formatter(val: number, opts) {
          const idx = opts?.dataPointIndex ?? 0;
          const n = seriesValues[idx] ?? 0;
          return `${n} (${Math.round(val)}%)`;
        },
        style: {
          fontSize: "11px",
          fontWeight: 600,
          colors: ["#ffffff", "#ffffff", "#0f172a", "#ffffff", "#ffffff"],
        },
        dropShadow: { enabled: false },
      },
      stroke: { width: 2, colors: [dark ? "#fafafa" : "#ffffff"] },
      plotOptions: {
        pie: {
          expandOnClick: true,
          dataLabels: {
            minAngleToShowLabel: 8,
            offset: -4,
          },
        },
      },
      tooltip: {
        theme: dark ? "dark" : "light",
        y: {
          formatter(val: number) {
            return `${val} total`;
          },
        },
      },
      states: {
        hover: { filter: { type: "darken", value: 0.92 } },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: { position: "bottom" },
            chart: { height: 260 },
          },
        },
      ],
    };
  }, [dark, labels, seriesValues]);

  if (!mounted) {
    return <div className="h-[300px] animate-pulse rounded-lg bg-muted/50" />;
  }

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No directory or exam counts yet.
      </p>
    );
  }

  return (
    <ReactApexChart options={options} series={seriesValues} type="pie" height={300} width="100%" />
  );
}
