"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PayHereReturnCancelPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="text-xl font-semibold">Checkout cancelled</h1>
      <p className="text-sm text-muted-foreground">
        You cancelled or left PayHere checkout before completing payment. Nothing is charged unless you
        reached the success step on PayHere.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={`/fees/${id}/pay`}
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Try again
        </Link>
        <Link
          href={`/fees/${id}`}
          className="inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Fee details
        </Link>
      </div>
    </div>
  );
}
