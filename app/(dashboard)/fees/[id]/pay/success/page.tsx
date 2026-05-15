"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PayHereReturnSuccessPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="text-xl font-semibold">Payment submitted</h1>
      <p className="text-sm text-muted-foreground">
        If PayHere completed the transaction, your fee record updates automatically when our server receives
        the PayHere confirmation. Refresh the fee after a minute if the balance hasn&apos;t changed yet.
      </p>
      <Link
        href={`/fees/${id}`}
        className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        ← Back to fee
      </Link>
    </div>
  );
}
