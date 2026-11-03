import { AdminGate } from "@/components/admin/admin-gate";

export const runtime = "edge";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGate>{children}</AdminGate>;
}
