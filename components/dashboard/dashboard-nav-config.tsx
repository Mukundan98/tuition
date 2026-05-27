"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  FileUp,
  Files,
  GraduationCap,
  LayoutGrid,
  MonitorPlay,
  Printer,
  LayoutDashboard,
  Layers,
  Receipt,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** If set, only these roles see the item; if null, all authenticated roles see it. */
  roles: string[] | null;
  /** If the signed-in user's role is listed here, the item is hidden (evaluated after `roles`). */
  hideForRoles?: string[];
  /** Optional grouping category for structural division in the sidebar navigation. */
  category?: "Master" | "Attendance" | "Time table" | "Exams" | "Finance" | "Leaves";
};

export const dashboardNavItems: DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: null },
  
  // Time table Category
  {
    title: "Timetable board",
    href: "/timetable/board",
    icon: LayoutGrid,
    roles: ["admin"],
    category: "Time table",
  },
  {
    title: "Timetable view",
    href: "/timetable/view",
    icon: Calendar,
    roles: ["admin"],
    category: "Time table",
  },
  {
    title: "Timetable",
    href: "/timetable",
    icon: Calendar,
    roles: ["student", "teacher"],
    category: "Time table",
  },

  // Master Category
  { title: "Students", href: "/students", icon: GraduationCap, roles: ["admin"], category: "Master" },
  { title: "Teachers", href: "/teachers", icon: Users, roles: ["admin"], category: "Master" },
  { title: "Classes", href: "/classes", icon: Layers, roles: ["admin"], category: "Master" },
  { title: "Subjects", href: "/subjects", icon: BookOpen, roles: ["admin"], category: "Master" },

  // Attendance Category
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["admin"], category: "Attendance" },
  {
    title: "Barcode labels",
    href: "/attendance/barcode-labels",
    icon: Printer,
    roles: ["admin"],
    category: "Attendance",
  },
  {
    title: "Attendance report",
    href: "/attendance/report",
    icon: FileSpreadsheet,
    roles: ["admin"],
    category: "Attendance",
  },

  // Exams Category
  { title: "Exams", href: "/exams", icon: ScrollText, roles: ["admin"], category: "Exams" },
  { title: "Online exams", href: "/online-exams", icon: MonitorPlay, roles: ["admin", "student"], category: "Exams" },
  { title: "Exam results", href: "/exams/results", icon: Award, roles: ["admin"], category: "Exams" },
  { title: "Exam results", href: "/exam-results", icon: Award, roles: ["student"], category: "Exams" },
  {
    title: "Exam paper uploads",
    href: "/exam-papers/submissions",
    icon: Files,
    roles: ["admin"],
    category: "Exams",
  },
  { title: "My exam papers", href: "/exam-papers", icon: FileUp, roles: ["teacher"], category: "Exams" },

  // Finance Category
  { title: "Fees", href: "/fees", icon: Wallet, roles: ["student"], category: "Finance" },
  { title: "Fees report", href: "/fees/report", icon: Receipt, roles: ["admin"], category: "Finance" },

  // Leaves Category
  { title: "Staff leaves", href: "/leaves/staff", icon: CalendarDays, roles: ["admin"], category: "Leaves" },
  { title: "Apply leave", href: "/leaves/apply", icon: Calendar, roles: ["teacher"], category: "Leaves" },

  // Uncategorized / General Category
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["admin"] },
  { title: "Alerts", href: "/notifications", icon: Bell, roles: null },
];
