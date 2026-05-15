import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type LeadCell = "none" | "avatar" | "double";

export function TableSkeletonRows({
  columns,
  rows = 8,
  leadCell = "none",
  lastColumnRight = false,
}: {
  columns: number;
  rows?: number;
  leadCell?: LeadCell;
  lastColumnRight?: boolean;
}) {
  const hasLead = leadCell !== "none";
  const bodyCols = hasLead ? columns - 1 : columns;

  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <TableRow key={ri} aria-hidden>
          {leadCell === "avatar" && (
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                  <Skeleton className="h-3 w-[min(100%,10rem)] max-w-full" />
                </div>
              </div>
            </TableCell>
          )}
          {leadCell === "double" && (
            <TableCell>
              <div className="space-y-2 py-0.5">
                <Skeleton className="h-4 w-[min(100%,12rem)] max-w-full" />
                <Skeleton className="h-3 w-24 max-w-full" />
              </div>
            </TableCell>
          )}
          {Array.from({ length: bodyCols }).map((_, ci) => {
            const isLast = lastColumnRight && ci === bodyCols - 1;
            return (
              <TableCell key={ci} className={isLast ? "text-right" : undefined}>
                <Skeleton
                  className={cn(
                    "h-4 max-w-full",
                    isLast ? "ms-auto w-24" : "w-[min(100%,9rem)]"
                  )}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

/** Full list page placeholder for Suspense (toolbar + titled table). */
export function ListPageTableSkeleton({
  headers,
  rows = 8,
  leadCell = "none",
  lastColumnRight = true,
}: {
  headers: string[];
  rows?: number;
  leadCell?: LeadCell;
  lastColumnRight?: boolean;
}) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead
                  key={h}
                  className={
                    lastColumnRight && i === headers.length - 1 ? "text-right" : undefined
                  }
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows
              columns={headers.length}
              rows={rows}
              leadCell={leadCell}
              lastColumnRight={lastColumnRight}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Marks grid (native table) while mark-sheet loads. */
export function MarkSheetTableSkeleton({
  subjectCols = 5,
  studentRows = 8,
}: {
  subjectCols?: number;
  studentRows?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-max min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-48 px-3 py-2 text-left font-medium">Student</th>
            {Array.from({ length: subjectCols }).map((_, i) => (
              <th key={i} className="min-w-[72px] border-l px-2 py-2">
                <Skeleton className="mx-auto h-4 w-10" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: studentRows }).map((_, ri) => (
            <tr key={ri} className="border-b">
              <td className="px-3 py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </td>
              {Array.from({ length: subjectCols }).map((_, ci) => (
                <td key={ci} className="border-l p-1">
                  <Skeleton className="mx-auto h-8 w-[68px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Profile / detail header area (no table). */
export function ProfileDetailSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl space-y-6 p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="space-y-3 pt-1">
            <Skeleton className="h-8 w-48 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>
    </div>
  );
}

/** Placeholder for card/list-style pages (e.g. exam performance). */
export function CardListPageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-[min(100%,20rem)]" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-24" />
      <ul className="space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <li key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-5 w-[min(100%,24rem)]" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-3 w-40" />
          </li>
        ))}
      </ul>
    </div>
  );
}
