"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  CalendarDays,
  Sparkles,
  Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
// import { ApiValidationSummary } from "@/components/ui/api-validation-summary";

type LeaveRow = {
  id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected" | string;
};

// Mock Data for Balances (can be moved to backend later)
const LEAVE_BALANCES = [
  { type: "Casual Leave", total: 10, used: 3, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  { type: "Sick Leave", total: 7, used: 2, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  { type: "Annual Leave", total: 15, used: 5, icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const LEAVE_TYPES = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "annual", label: "Annual Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

export function LeaveApplyClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");

  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    const res = await apiFetch<LeaveRow[]>("leaves");
    if (res.json?.success && res.json.data) {
      setRecentLeaves(res.json.data);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    // Validate Leave Type
    if (!leaveType || leaveType.trim() === "") {
      newErrors.leave_type = ["Please select a leave type"];
    } else if (!LEAVE_TYPES.find(lt => lt.value === leaveType)) {
      newErrors.leave_type = ["Please select a valid leave type"];
    }

    // Validate From Date
    if (!fromDate || fromDate.trim() === "") {
      newErrors.from_date = ["Please select a from date"];
    } else {
      const fromDateObj = new Date(fromDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (fromDateObj < today) {
        newErrors.from_date = ["From date must be today or in the future"];
      }
    }

    // Validate To Date
    if (!toDate || toDate.trim() === "") {
      newErrors.to_date = ["Please select a to date"];
    } else {
      const toDateObj = new Date(toDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (toDateObj < today) {
        newErrors.to_date = ["To date must be today or in the future"];
      }
    }

    // Validate From Date <= To Date
    if (fromDate && toDate) {
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      if (fromDateObj > toDateObj) {
        newErrors.from_date = ["From date must be before or equal to to date"];
      }
    }

    // Validate Reason
    if (!reason || reason.trim() === "") {
      newErrors.reason = ["Please provide a reason for your leave"];
    } else if (reason.trim().length < 5) {
      newErrors.reason = ["Reason must be at least 5 characters long"];
    } else if (reason.trim().length > 500) {
      newErrors.reason = ["Reason must not exceed 500 characters"];
    }

    // Validate Attachment if provided
    if (attachment) {
      const maxSizeInMB = 5;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (attachment.size > maxSizeInBytes) {
        newErrors.attachment = [`File size must not exceed ${maxSizeInMB}MB`];
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(attachment.type)) {
        newErrors.attachment = ["File must be PDF, JPG, or PNG"];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("leave_type", leaveType);
    formData.append("from_date", fromDate);
    formData.append("to_date", toDate);
    formData.append("reason", reason);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    const res = await apiFetch("leaves", {
      method: "POST",
      body: formData,
    });

    setIsSubmitting(false);

    if (res.json?.success) {
      alert("Leave application submitted successfully!");
      setLeaveType("");
      setFromDate("");
      setToDate("");
      setReason("");
      setAttachment(null);
      setErrors({});
      fetchLeaves();
    } else {
      if (res.status === 422 && res.json?.errors) {
        setErrors(res.json.errors);
      } else {
        setApiError(res.json?.message || "An error occurred while submitting.");
      }
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <CalendarIcon className="size-4 text-indigo-500 dark:text-indigo-400" />
                Teacher Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">Apply & Track</p>
              <p className="text-xs text-muted-foreground">Manage your time off</p>
            </div>
          </div>
        </header>

        {/* Balances Section */}
        <section className="grid gap-4 sm:grid-cols-3">
          {LEAVE_BALANCES.map((balance) => (
            <Card key={balance.type} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/75 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 backdrop-blur-sm">
              <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-all duration-300", balance.bg.replace('/10', ''))} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-6">
                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {balance.type}
                </CardTitle>
                <div className={cn("rounded-xl p-2.5 ring-1 ring-inset ring-foreground/10", balance.bg)}>
                  <balance.icon className={cn("size-4", balance.color)} />
                </div>
              </CardHeader>
              <CardContent className="pl-6 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                    {balance.total - balance.used}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">remaining</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", balance.bg.replace('/10', ''))} 
                    style={{ width: `${(balance.used / balance.total) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-medium flex justify-between">
                  <span>Used: {balance.used}</span>
                  <span>Total: {balance.total}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Leave Application Form */}
          <div className="lg:col-span-7">
            <Card className="relative overflow-hidden rounded-[2rem] border-0 shadow-xl bg-card">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <CardHeader className="pt-8 pb-6 px-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  New Leave Request
                  <Sparkles className="size-5 text-indigo-500" />
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Fill out the form below to apply for a leave of absence. Ensure you provide enough notice for non-emergency leaves.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="px-8 space-y-6">
                  {apiError && (
                    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/20 dark:text-red-200">
                      {apiError}
                    </div>
                  )}
                  {/* <ApiValidationSummary errors={errors} /> */}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Leave Type <span className="text-rose-500">*</span></Label>
                      <div className="flex gap-6 items-center">
                        <div className="flex items-center gap-2">
                          <input 
                            id="casual-leave"
                            type="checkbox" 
                            checked={leaveType === "casual"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLeaveType("casual");
                                if (errors.leave_type) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.leave_type;
                                    return newErrors;
                                  });
                                }
                              }
                            }}
                            className={cn("w-5 h-5 rounded border-2 cursor-pointer transition-colors", errors.leave_type ? "border-rose-500" : "border-gray-300")}
                          />
                          <Label htmlFor="casual-leave" className="text-sm font-medium cursor-pointer">Casual Leave</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            id="annual-leave"
                            type="checkbox" 
                            checked={leaveType === "annual"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLeaveType("annual");
                                if (errors.leave_type) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.leave_type;
                                    return newErrors;
                                  });
                                }
                              }
                            }}
                            className={cn("w-5 h-5 rounded border-2 cursor-pointer transition-colors", errors.leave_type ? "border-rose-500" : "border-gray-300")}
                          />
                          <Label htmlFor="annual-leave" className="text-sm font-medium cursor-pointer">Annual Leave</Label>
                        </div>
                      </div>
                      {errors.leave_type && <p className="text-sm text-rose-500 flex items-center gap-1"><AlertCircle className="size-3.5" />{errors.leave_type[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-date" className="text-sm font-semibold">From Date <span className="text-rose-500">*</span></Label>
                        <Input 
                          id="from-date" 
                          type="date" 
                          className={cn("h-12 bg-muted/20 transition-colors", errors.from_date && "border-rose-500 focus:ring-rose-500")}
                          value={fromDate}
                          onChange={(e) => {
                            setFromDate(e.target.value);
                            if (errors.from_date) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.from_date;
                                return newErrors;
                              });
                            }
                          }}
                        />
                        {errors.from_date && <p className="text-sm text-rose-500 flex items-center gap-1"><AlertCircle className="size-3.5" />{errors.from_date[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="to-date" className="text-sm font-semibold">To Date <span className="text-rose-500">*</span></Label>
                        <Input 
                          id="to-date" 
                          type="date" 
                          className={cn("h-12 bg-muted/20 transition-colors", errors.to_date && "border-rose-500 focus:ring-rose-500")}
                          value={toDate}
                          onChange={(e) => {
                            setToDate(e.target.value);
                            if (errors.to_date) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.to_date;
                                return newErrors;
                              });
                            }
                          }}
                        />
                        {errors.to_date && <p className="text-sm text-rose-500 flex items-center gap-1"><AlertCircle className="size-3.5" />{errors.to_date[0]}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reason" className="text-sm font-semibold">Reason <span className="text-rose-500">*</span></Label>
                        <span className={cn("text-xs font-medium", reason.length > 500 ? "text-rose-500" : "text-muted-foreground")}>
                          {reason.length}/500
                        </span>
                      </div>
                      <Textarea 
                        id="reason" 
                        placeholder="Please briefly explain the reason for your leave..." 
                        className={cn("min-h-[120px] resize-y bg-muted/20 p-4 transition-colors", errors.reason && "border-rose-500 focus:ring-rose-500")}
                        value={reason}
                        maxLength={500}
                        onChange={(e) => {
                          setReason(e.target.value);
                          if (errors.reason) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.reason;
                              return newErrors;
                            });
                          }
                        }}
                      />
                      {errors.reason && <p className="text-sm text-rose-500 flex items-center gap-1"><AlertCircle className="size-3.5" />{errors.reason[0]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attachment" className="text-sm font-semibold">Attachment (Optional)</Label>
                      <div className="flex flex-col gap-3">
                        <Input 
                          id="attachment" 
                          type="file" 
                          accept="application/pdf,image/jpeg,image/png"
                          className={cn("h-12 bg-muted/20 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors", errors.attachment && "border-rose-500 focus:ring-rose-500")}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setAttachment(e.target.files[0]);
                              if (errors.attachment) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.attachment;
                                  return newErrors;
                                });
                              }
                            } else {
                              setAttachment(null);
                            }
                          }}
                        />
                        {attachment && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                              {attachment.name} ({(attachment.size / 1024 / 1024).toFixed(2)}MB)
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3" />
                        Attach medical certificate if applying for Sick Leave extending beyond 2 days. Max size 5MB (PDF/JPG/PNG).
                      </p>
                      {errors.attachment && <p className="text-sm text-rose-500 flex items-center gap-1"><AlertCircle className="size-3.5" />{errors.attachment[0]}</p>}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-8 pb-8 pt-4 bg-muted/5 border-t border-border/40 mt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting} 
                    className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Leave History sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-[2rem] border-border/60 bg-card/80 shadow-md backdrop-blur-sm h-full">
              <CardHeader className="border-b border-border/50 pb-4 px-6 pt-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="size-5 text-indigo-500" />
                  Recent Applications
                </CardTitle>
                <CardDescription>Your recently submitted leave requests.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentLeaves.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent leave applications.
                    </div>
                  ) : (
                    recentLeaves.map((leave) => (
                      <div key={leave.id} className="p-6 transition-colors hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-foreground flex items-center gap-2 capitalize">
                              {leave.leave_type} Leave
                              {leave.status === "Approved" && <CheckCircle2 className="size-4 text-emerald-500" />}
                              {leave.status === "Pending" && <Clock className="size-4 text-amber-500" />}
                              {leave.status === "Rejected" && <XCircle className="size-4 text-rose-500" />}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {leave.from_date} &rarr; {leave.to_date}
                            </p>
                            <p className="text-sm font-medium mt-2 line-clamp-1">{leave.reason}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                            leave.status === "Approved" && "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
                            leave.status === "Pending" && "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
                            leave.status === "Rejected" && "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400"
                          )}>
                            {leave.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
