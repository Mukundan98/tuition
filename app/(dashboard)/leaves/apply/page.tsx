import { LeaveApplyClient } from "@/components/leaves/leave-apply-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply Leave | Tuition Class Management",
  description: "Apply for a leave of absence",
};

export default function LeaveApplyPage() {
  return <LeaveApplyClient />;
}
