import { StaffLeavesClient } from "@/components/leaves/staff-leaves-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Leaves | Tuition Class Management",
  description: "Manage and review staff leave requests",
};

export default function StaffLeavesPage() {
  return <StaffLeavesClient />;
}
