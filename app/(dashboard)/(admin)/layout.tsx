import { AdminGate } from "@/components/admin/admin-gate";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGate>{children}</AdminGate>;
}
