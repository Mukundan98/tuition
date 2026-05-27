"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  Loader2,
  Calendar,
  Inbox,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { apiFetch, apiJson } from "@/lib/api";

type LeaveRequest = {
  id: number;
  user_id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  attachment_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  Pending: {
    label: "Pending",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 ring-amber-500/20",
    icon: Clock,
  },
  Approved: {
    label: "Approved",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 ring-rose-500/20",
    icon: XCircle,
  },
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  annual: "Annual Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(from: string, to: string) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function StaffLeavesClient() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<LeaveRequest[]>("leaves");
    if (res.json?.success && res.json.data) {
      setLeaves(res.json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleStatusUpdate = async (leaveId: number, status: "Approved" | "Rejected") => {
    setActionLoading(leaveId);
    const res = await apiJson<LeaveRequest>(`leaves/${leaveId}/status`, "PATCH", { status });
    if (res.json?.success) {
      setLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status } : l))
      );
      if (selectedLeave?.id === leaveId) {
        setSelectedLeave((prev) => (prev ? { ...prev, status } : null));
      }
    }
    setActionLoading(null);
  };

  // Filter logic
  const filtered = leaves.filter((leave) => {
    const matchesSearch =
      searchQuery === "" ||
      `${leave.user?.name ?? ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      leave.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || leave.status === statusFilter;
    const matchesType = typeFilter === "all" || leave.leave_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    rejected: leaves.filter((l) => l.status === "Rejected").length,
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <CalendarDays className="size-4 text-indigo-500 dark:text-indigo-400" />
                Admin Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Staff Leaves</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review and manage teacher leave requests
              </p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Requests",
              value: stats.total,
              icon: FileText,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              accent: "bg-blue-500",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              accent: "bg-amber-500",
            },
            {
              label: "Approved",
              value: stats.approved,
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              accent: "bg-emerald-500",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: XCircle,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
              accent: "bg-rose-500",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/75 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 backdrop-blur-sm"
            >
              <div className={cn("absolute top-0 left-0 w-1.5 h-full", stat.accent)} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-6">
                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={cn("rounded-xl p-2.5 ring-1 ring-inset ring-foreground/10", stat.bg)}>
                  <stat.icon className={cn("size-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent className="pl-6 pt-2">
                <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                  {stat.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Main Table Card */}
        <Card className="relative overflow-hidden rounded-[2rem] border-0 shadow-xl bg-card">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Filters */}
          <CardHeader className="pt-8 pb-4 px-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Leave Requests
              </CardTitle>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="staff-leave-search"
                  placeholder="Search by teacher name or email..."
                  className="pl-10 h-11 bg-muted/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
                  <SelectTrigger id="status-filter" className="w-[150px] h-11 bg-muted/20 rounded-xl">
                    <Filter className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? "all")}>
                  <SelectTrigger id="type-filter" className="w-[160px] h-11 bg-muted/20 rounded-xl">
                    <Filter className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0 pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-3 text-indigo-500" />
                <p className="text-sm font-medium">Loading leave requests…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Inbox className="size-12 mb-4 text-muted-foreground/40" />
                <p className="text-base font-semibold">No leave requests found</p>
                <p className="text-sm mt-1">
                  {leaves.length > 0 ? "Try adjusting your filters." : "No leave requests have been submitted yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="pl-6 sm:pl-8 font-bold text-xs uppercase tracking-wider">Teacher</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Duration</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Days</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Applied On</TableHead>
                      <TableHead className="pr-6 sm:pr-8 font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((leave) => {
                      const cfg = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.Pending;
                      const StatusIcon = cfg.icon;
                      const days = daysBetween(leave.from_date, leave.to_date);
                      const isProcessing = actionLoading === leave.id;

                      return (
                        <TableRow
                          key={leave.id}
                          className="group cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell className="pl-6 sm:pl-8">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shrink-0">
                                {leave.user?.name?.[0]}
                                {leave.user?.name?.split(" ")[1]?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {leave.user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {leave.user?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium capitalize">
                              {LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">{formatDate(leave.from_date)}</span>
                              <span className="text-muted-foreground mx-1">→</span>
                              <span className="font-medium">{formatDate(leave.to_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center size-7 rounded-full bg-muted/60 text-xs font-bold">
                              {days}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                                cfg.bg,
                                cfg.color
                              )}
                            >
                              <StatusIcon className="size-3.5" />
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(leave.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 sm:pr-8">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {leave.status === "Pending" ? (
                                <>
                                  <Button
                                    id={`approve-leave-${leave.id}`}
                                    size="sm"
                                    disabled={isProcessing}
                                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm gap-1"
                                    onClick={() => handleStatusUpdate(leave.id, "Approved")}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <ThumbsUp className="size-3" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    id={`reject-leave-${leave.id}`}
                                    size="sm"
                                    variant="outline"
                                    disabled={isProcessing}
                                    className="h-8 rounded-lg border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950 text-xs font-semibold gap-1"
                                    onClick={() => handleStatusUpdate(leave.id, "Rejected")}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <ThumbsDown className="size-3" />
                                    )}
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  id={`view-leave-${leave.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 rounded-lg text-xs font-semibold gap-1"
                                  onClick={() => {
                                    setSelectedLeave(leave);
                                    setDetailOpen(true);
                                  }}
                                >
                                  <Eye className="size-3" />
                                  View
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-indigo-500" />
              Leave Request Details
            </DialogTitle>
            <DialogDescription>
              Review the leave request details and take action below.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <>
              <DialogBody className="space-y-6">
                {/* Teacher Info */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold shrink-0">
                    {selectedLeave.user?.name?.[0]}
                    {selectedLeave.user?.name?.split(" ")[1]?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-base">
                      {selectedLeave.user?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedLeave.user?.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Leave Type"
                    value={LEAVE_TYPE_LABELS[selectedLeave.leave_type] ?? selectedLeave.leave_type}
                    icon={<Calendar className="size-4 text-indigo-500" />}
                  />
                  <DetailField
                    label="Status"
                    value={
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                          STATUS_CONFIG[selectedLeave.status]?.bg,
                          STATUS_CONFIG[selectedLeave.status]?.color
                        )}
                      >
                        {selectedLeave.status}
                      </span>
                    }
                    icon={<AlertTriangle className="size-4 text-amber-500" />}
                  />
                  <DetailField
                    label="From Date"
                    value={formatDate(selectedLeave.from_date)}
                    icon={<CalendarDays className="size-4 text-emerald-500" />}
                  />
                  <DetailField
                    label="To Date"
                    value={formatDate(selectedLeave.to_date)}
                    icon={<CalendarDays className="size-4 text-rose-500" />}
                  />
                  <DetailField
                    label="Total Days"
                    value={`${daysBetween(selectedLeave.from_date, selectedLeave.to_date)} day(s)`}
                    icon={<Clock className="size-4 text-blue-500" />}
                  />
                  <DetailField
                    label="Applied On"
                    value={formatDate(selectedLeave.created_at)}
                    icon={<FileText className="size-4 text-purple-500" />}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</p>
                  <div className="rounded-xl bg-muted/20 border border-border/50 p-4">
                    <p className="text-sm leading-relaxed">{selectedLeave.reason}</p>
                  </div>
                </div>

                {/* Attachment */}
                {selectedLeave.attachment_path && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachment</p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/storage/${selectedLeave.attachment_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      <FileText className="size-4" />
                      View Attachment
                    </a>
                  </div>
                )}
              </DialogBody>

              {/* Actions Footer */}
              {selectedLeave.status === "Pending" && (
                <DialogFooter>
                  <Button
                    id="dialog-reject-leave"
                    variant="outline"
                    disabled={actionLoading === selectedLeave.id}
                    className="rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950 font-semibold gap-1.5"
                    onClick={() => handleStatusUpdate(selectedLeave.id, "Rejected")}
                  >
                    {actionLoading === selectedLeave.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="size-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    id="dialog-approve-leave"
                    disabled={actionLoading === selectedLeave.id}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm gap-1.5"
                    onClick={() => handleStatusUpdate(selectedLeave.id, "Approved")}
                  >
                    {actionLoading === selectedLeave.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="size-4" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
