"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Award, Calendar, Clock, Download, GraduationCap, Layers, MonitorPlay, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { apiDownload, apiFetch, triggerBrowserDownload } from "@/lib/api";
import type { SchoolClassRow, ExamRow, ExamResultsRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type OnlineExamAttemptRow = {
  id: number;
  student: {
    id: number;
    name: string;
    admission_number: string;
  } | null;
  score: string | null;
  max_score: string | null;
  percentage: number | null;
  submitted_at: string | null;
};

type OnlineExamRow = {
  id: number;
  title: string;
  duration_minutes: number;
  questions_count?: number;
};

const getOnlineExamGrade = (pct: number) => {
  if (pct >= 97) return "A+";
  if (pct >= 93) return "A";
  if (pct >= 89) return "A-";
  if (pct >= 85) return "B+";
  if (pct >= 81) return "B";
  if (pct >= 77) return "B-";
  if (pct >= 73) return "C+";
  if (pct >= 69) return "C";
  if (pct >= 65) return "C-";
  if (pct >= 61) return "D+";
  if (pct >= 57) return "D";
  return "F";
};

export function AdminExamResultsListClient() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [activeTab, setActiveTab] = useState<"semester" | "online">("semester");

  const [semesterExams, setSemesterExams] = useState<ExamRow[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [semesterResults, setSemesterResults] = useState<ExamResultsRow[]>([]);
  const [loadingSemesterResults, setLoadingSemesterResults] = useState(false);

  const [onlineExams, setOnlineExams] = useState<OnlineExamRow[]>([]);
  const [selectedOnlineExamId, setSelectedOnlineExamId] = useState("");
  const [onlineResults, setOnlineResults] = useState<OnlineExamAttemptRow[]>([]);
  const [loadingOnlineResults, setLoadingOnlineResults] = useState(false);

  const [loadingExams, setLoadingExams] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) {
        setClasses(r.json.data.items);
      }
    })();
  }, []);

  // Fetch exams when class or tab changes
  useEffect(() => {
    if (!selectedClassId) {
      setSemesterExams([]);
      setOnlineExams([]);
      setSelectedExamId("");
      setSelectedOnlineExamId("");
      setSemesterResults([]);
      setOnlineResults([]);
      return;
    }

    void (async () => {
      setLoadingExams(true);
      setErr(null);
      if (activeTab === "semester") {
        const r = await apiFetch<{ items: ExamRow[] }>(`exams?class_id=${selectedClassId}&per_page=100`);
        setLoadingExams(false);
        if (r.json?.success && r.json.data?.items) {
          setSemesterExams(r.json.data.items);
          if (r.json.data.items.length > 0) {
            setSelectedExamId(String(r.json.data.items[0].id));
          } else {
            setSelectedExamId("");
            setSemesterResults([]);
          }
        } else {
          setErr("Failed to load semester exams.");
        }
      } else {
        const r = await apiFetch<{ items: OnlineExamRow[] }>(`online-exams?class_id=${selectedClassId}&per_page=100`);
        setLoadingExams(false);
        if (r.json?.success && r.json.data?.items) {
          setOnlineExams(r.json.data.items);
          if (r.json.data.items.length > 0) {
            setSelectedOnlineExamId(String(r.json.data.items[0].id));
          } else {
            setSelectedOnlineExamId("");
            setOnlineResults([]);
          }
        } else {
          setErr("Failed to load online exams.");
        }
      }
    })();
  }, [selectedClassId, activeTab]);

  // Fetch semester exam results
  useEffect(() => {
    if (activeTab !== "semester" || !selectedExamId) {
      setSemesterResults([]);
      return;
    }

    void (async () => {
      setLoadingSemesterResults(true);
      setErr(null);
      const r = await apiFetch<{ rows: ExamResultsRow[] }>(`exams/${selectedExamId}/results`);
      setLoadingSemesterResults(false);
      if (r.json?.success && r.json.data?.rows) {
        setSemesterResults(r.json.data.rows);
      } else {
        setErr(r.json?.message ?? "Failed to load results.");
      }
    })();
  }, [selectedExamId, activeTab]);

  // Fetch online exam attempts
  useEffect(() => {
    if (activeTab !== "online" || !selectedOnlineExamId) {
      setOnlineResults([]);
      return;
    }

    void (async () => {
      setLoadingOnlineResults(true);
      setErr(null);
      const r = await apiFetch<{ items: OnlineExamAttemptRow[] }>(`online-exams/${selectedOnlineExamId}/attempts`);
      setLoadingOnlineResults(false);
      if (r.json?.success && r.json.data?.items) {
        setOnlineResults(r.json.data.items);
      } else {
        setErr(r.json?.message ?? "Failed to load attempts.");
      }
    })();
  }, [selectedOnlineExamId, activeTab]);

  async function downloadPdf(examId: string, studentId: number) {
    const r = await apiDownload(`exams/${examId}/report-card/${studentId}`);
    if (!r.ok) return;
    const name =
      r.filename?.replace(/"/g, "").replace(/^UTF-8''/, "") ??
      `report-${examId}-${studentId}.pdf`;
    triggerBrowserDownload(r.blob, name || `report.pdf`);
  }

  const selectedClass = classes.find((c) => String(c.id) === selectedClassId);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          <Award className="size-4 text-indigo-500" />
          Examination Management
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
        <p className="text-sm text-muted-foreground">
          View grade-wise and class-wise student marks lists for semester and online exams.
        </p>
      </header>

      {/* Filter Selection Panel */}
      <Card className="rounded-2xl border shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="size-3.5 text-indigo-500" />
              Class / Grade
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="">Select a Grade / Class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedClassId && activeTab === "semester" && (
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ScrollText className="size-3.5 text-indigo-500" />
                Semester Exam
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                disabled={loadingExams}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                {semesterExams.length === 0 ? (
                  <option value="">No semester exams found</option>
                ) : (
                  semesterExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {selectedClassId && activeTab === "online" && (
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MonitorPlay className="size-3.5 text-indigo-500" />
                Online Exam
              </label>
              <select
                value={selectedOnlineExamId}
                onChange={(e) => setSelectedOnlineExamId(e.target.value)}
                disabled={loadingExams}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                {onlineExams.length === 0 ? (
                  <option value="">No online exams found</option>
                ) : (
                  onlineExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-border/50 bg-muted/40 p-1 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab("semester")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === "semester"
              ? "bg-background text-indigo-600 shadow-sm border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-background/25"
          )}
        >
          <ScrollText className="size-3.5" />
          Semester Exams
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("online")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === "online"
              ? "bg-background text-indigo-600 shadow-sm border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-background/25"
          )}
        >
          <MonitorPlay className="size-3.5" />
          Online Exams
        </button>
      </div>

      {err && (
        <Card className="border-destructive/30 bg-destructive/5 rounded-xl shadow-md p-4 text-destructive flex items-center gap-3">
          <span className="text-sm font-semibold">{err}</span>
        </Card>
      )}

      {/* Content Display */}
      {!selectedClassId ? (
        <Card className="rounded-[2rem] border-dashed border-2 bg-muted/5 py-16 text-center">
          <GraduationCap className="mx-auto size-16 text-muted-foreground/30 mb-4" />
          <CardTitle className="text-lg font-bold">Select Grade / Class</CardTitle>
          <CardDescription className="max-w-xs mx-auto mt-2">
            Please choose a class from the dropdown menu above to view its exam results list.
          </CardDescription>
        </Card>
      ) : activeTab === "semester" ? (
        // Semester Exams Table
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ScrollText className="size-4 text-indigo-500" />
              Semester Exams Marks List
            </CardTitle>
            <CardDescription>
              Displaying student results in {selectedClass?.name || "selected class"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Student</TableHead>
                    <TableHead className="text-right">Avg Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="px-6">Subject Breakdown</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSemesterResults ? (
                    <TableSkeletonRows columns={6} lastColumnRight />
                  ) : !selectedExamId ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                        No semester exams created for this class yet.
                      </TableCell>
                    </TableRow>
                  ) : semesterResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                        No marks submitted for this semester exam.
                      </TableCell>
                    </TableRow>
                  ) : (
                    semesterResults.map((row) => (
                      <TableRow key={row.student.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="px-6 font-semibold text-foreground">
                          {row.student.name}
                          <span className="ml-2 text-xs font-bold text-muted-foreground/60 tabular-nums">
                            {row.student.admission_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold">
                          {row.average_marks ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center font-bold text-xs size-7 rounded-lg ring-1 ring-inset",
                            row.average_grade && !row.average_grade.startsWith("F")
                              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                          )}>
                            {row.average_grade ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.average_percentage ? `${row.average_percentage}%` : "—"}
                        </TableCell>
                        <TableCell className="px-6 text-xs text-muted-foreground max-w-[280px] truncate">
                          {row.lines?.map((l) => `${l.subject_code ?? l.subject_id}:${l.marks_obtained}`).join(" · ") || "—"}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {row.lines && row.lines.length > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1 border-indigo-500/20 hover:bg-indigo-500/5 hover:text-indigo-600"
                              onClick={() => void downloadPdf(selectedExamId, row.student.id)}
                            >
                              <Download className="size-3.5" />
                              PDF
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Marks</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Online Exams Table
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MonitorPlay className="size-4 text-indigo-500" />
              Online Exams Marks List
            </CardTitle>
            <CardDescription>
              Displaying student results in {selectedClass?.name || "selected class"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Student</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Max Score</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right px-6">Submission Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOnlineResults ? (
                    <TableSkeletonRows columns={6} lastColumnRight />
                  ) : !selectedOnlineExamId ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                        No online exams created for this class yet.
                      </TableCell>
                    </TableRow>
                  ) : onlineResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                        No attempts submitted for this online exam.
                      </TableCell>
                    </TableRow>
                  ) : (
                    onlineResults.map((row) => {
                      const grade = row.percentage !== null ? getOnlineExamGrade(row.percentage) : "—";
                      return (
                        <TableRow key={row.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="px-6 font-semibold text-foreground">
                            {row.student?.name ?? "—"}
                            {row.student?.admission_number && (
                              <span className="ml-2 text-xs font-bold text-muted-foreground/60 tabular-nums">
                                {row.student.admission_number}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-bold">
                            {row.score ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {row.max_score ?? "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center font-bold text-xs size-7 rounded-lg ring-1 ring-inset",
                              grade !== "—" && !grade.startsWith("F")
                                ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                            )}>
                              {grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {row.percentage !== null ? `${row.percentage}%` : "—"}
                          </TableCell>
                          <TableCell className="text-right px-6 text-xs text-muted-foreground">
                            {row.submitted_at ? (
                              <span className="flex items-center justify-end gap-1.5">
                                <Clock className="size-3 text-indigo-500/60" />
                                {new Date(row.submitted_at).toLocaleString()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
