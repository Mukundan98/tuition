import { Suspense } from "react";
import { ListPageTableSkeleton } from "@/components/ui/table-skeleton";
import { TeachersListClient } from "./teachers-list-client";

export default function TeachersPage() {
  return (
    <Suspense
      fallback={
        <ListPageTableSkeleton
          headers={["Name", "Employee ID", "Subjects", "Actions"]}
          leadCell="avatar"
        />
      }
    >
      <TeachersListClient />
    </Suspense>
  );
}
