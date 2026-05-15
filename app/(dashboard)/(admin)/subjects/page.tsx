import { Suspense } from "react";
import { ListPageTableSkeleton } from "@/components/ui/table-skeleton";
import { SubjectsListClient } from "./subjects-list-client";

type Props = { searchParams?: { class_id?: string } };

export default function SubjectsPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <ListPageTableSkeleton
          headers={["Subject", "Code", "Class", "Teacher", "Actions"]}
        />
      }
    >
      <SubjectsListClient initialClassFilter={searchParams?.class_id ?? null} />
    </Suspense>
  );
}
