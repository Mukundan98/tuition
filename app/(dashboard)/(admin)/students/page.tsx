import { Suspense } from "react";
import { ListPageTableSkeleton } from "@/components/ui/table-skeleton";
import { StudentsListClient } from "./students-list-client";

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <ListPageTableSkeleton
          headers={["Name", "Admission", "Class", "Parent", "Actions"]}
          leadCell="avatar"
        />
      }
    >
      <StudentsListClient />
    </Suspense>
  );
}
