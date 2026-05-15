"use client";

import { Button } from "@/components/ui/button";

type Meta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function PaginationBar({
  meta,
  onPage,
}: {
  meta: Meta;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        Page {meta.current_page} of {meta.last_page} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
