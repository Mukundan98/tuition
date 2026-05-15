"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
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
};

export const dashboardNavItems: DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: null },
  {
    title: "Timetable board",
    href: "/timetable/board",
    icon: LayoutGrid,
    roles: ["admin"],
  },
  {
    title: "Timetable view",
    href: "/timetable/view",
    icon: Calendar,
    roles: ["admin"],
  },
  {
    title: "Timetable",
    href: "/timetable",
    icon: Calendar,
    roles: ["student", "teacher"],
  },
  { title: "Students", href: "/students", icon: GraduationCap, roles: ["admin"] },
  { title: "Teachers", href: "/teachers", icon: Users, roles: ["admin"] },
  { title: "Classes", href: "/classes", icon: Layers, roles: ["admin"] },
  { title: "Subjects", href: "/subjects", icon: BookOpen, roles: ["admin"] },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["admin"] },
  {
    title: "Barcode labels",
    href: "/attendance/barcode-labels",
    icon: Printer,
    roles: ["admin"],
  },
  {
    title: "Attendance report",
    href: "/attendance/report",
    icon: FileSpreadsheet,
    roles: ["admin"],
  },
  { title: "Fees", href: "/fees", icon: Wallet, roles: ["student"] },
  { title: "Exam results", href: "/exam-results", icon: Award, roles: ["student"] },
  { title: "Fees report", href: "/fees/report", icon: Receipt, roles: ["admin"] },
  {
    title: "Exam paper uploads",
    href: "/exam-papers/submissions",
    icon: Files,
    roles: ["admin"],
  },
  { title: "My exam papers", href: "/exam-papers", icon: FileUp, roles: ["teacher"] },
  { title: "Exams", href: "/exams", icon: ScrollText, roles: ["admin"] },
  { title: "Online exams", href: "/online-exams", icon: MonitorPlay, roles: ["admin", "student"] },
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["admin"] },
  { title: "Alerts", href: "/notifications", icon: Bell, roles: null },
];
