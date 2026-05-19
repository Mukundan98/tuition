export type ListMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type SchoolClassRow = {
  id: number;
  name: string;
  section: string | null;
  academic_year: string | null;
  max_students: number | null;
  homeroom_teacher_id: number | null;
  homeroom_teacher: {
    id: number;
    employee_id: string;
    name: string | null;
  } | null;
};

export type StudentRow = {
  id: number;
  name: string;
  email: string | null;
  admission_number: string;
  parent_name: string | null;
  parent_phone: string | null;
  photo_url: string | null;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
};

export type TeacherRow = {
  id: number;
  employee_id: string;
  qualification: string | null;
  specialization: string | null;
  photo_url: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  subjects: Array<{
    id: number;
    name: string;
    code: string;
    class_id: number;
  }>;
};

export type SubjectRow = {
  id: number;
  /** When `aggregate=1` list: delete all of these to remove the subject from every class. */
  subject_ids?: number[];
  /** Compact class list for grouped rows, e.g. "6, 7, 8" (excludes "common"). */
  classes_label?: string | null;
  class_id: number;
  teacher_id: number | null;
  name: string;
  code: string;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
  teacher: {
    id: number;
    name: string | null;
  } | null;
};

export type AttendanceDayStudentRow = {
  student_id: number;
  name: string;
  admission_number: string;
  attendance: {
    id: number;
    status: string;
    remark: string | null;
  } | null;
};

export type AttendanceCalendarDay = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  marked: number;
  enrollment: number;
  unmarked: number;
};

export type AttendanceReportRow = {
  id: number;
  attended_on: string;
  status: string;
  remark: string | null;
  student: {
    id: number;
    name: string;
    admission_number: string;
  } | null;
  class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
};

export type FeeOverviewStats = {
  total_fees_records: number;
  fees_with_balance: number;
  pending_balance: number;
  paid_this_month: number;
  overdue_count: number;
  partial_count: number;
  paid_in_full_count: number;
};

export type FeeRow = {
  id: number;
  student_id: number;
  title: string;
  amount: string;
  due_date: string;
  paid_total: number;
  balance: number;
  status: string;
  student: {
    id: number;
    name: string;
    admission_number: string;
  } | null;
};

export type FeePaymentItem = {
  id: number;
  amount: string;
  paid_at: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
};

export type FeeDetail = Omit<FeeRow, "student"> & {
  notes: string | null;
  student: FeeRow["student"];
  payments: FeePaymentItem[];
};

export type FeeReportPaymentRow = {
  id: number;
  amount: string;
  paid_at: string;
  payment_method: string | null;
  reference: string | null;
  fee_title: string | null;
  student: {
    id: number;
    name: string;
    admission_number: string;
  } | null;
  recorded_by: { id: number; name: string } | null;
};

export type ExamRow = {
  id: number;
  class_id: number;
  title: string;
  exam_date: string;
  max_marks: string;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
};

export type ExamPaperRow = {
  id: number;
  title: string | null;
  notes: string | null;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string | null;
  exam: {
    id: number;
    title: string;
    exam_date: string | null;
  } | null;
  subject: {
    id: number;
    name: string;
    code: string;
  } | null;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
  teacher?: {
    id: number;
    employee_id: string;
    name: string | null;
    email: string | null;
  };
};

export type ExamPaperAdminStats = {
  total_uploads: number;
  uploads_last_7_days: number;
  unique_teachers: number;
  unique_classes: number;
  unique_subjects: number;
};

/** Options for teachers uploading exam papers (`GET my-teaching-subjects`). */
export type TeachingSubjectOption = {
  id: number;
  class_id: number;
  teacher_id: number | null;
  name: string;
  code: string;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
  teacher: { id: number; name: string | null } | null;
};

export type TimetableStudentRow = {
  id: number;
  class_id: number;
  subject_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: { id: number; name: string; code: string } | null;
  teacher_name: string | null;
};

export type TimetableStudentClass = {
  id: number;
  name: string;
  section: string | null;
  academic_year: string | null;
};

export type TimetableStudentStats = {
  total_periods: number;
  days_with_class: number;
  distinct_subjects: number;
};

export type TimetableTeacherRow = {
  id: number;
  class_id: number;
  subject_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: { id: number; name: string; code: string } | null;
  school_class: {
    id: number;
    name: string;
    section: string | null;
  } | null;
};

export type TimetableTeacherStats = {
  total_sessions: number;
  unique_classes: number;
  by_day: Record<string, number>;
  busiest_day: { day_of_week: number; count: number } | null;
};

export type MarkSheetCell = {
  marks_obtained: string;
  grade: string | null;
  remarks: string | null;
};

export type ExamResultLine = {
  subject_id: number;
  subject_name: string | null;
  subject_code: string | null;
  marks_obtained: string;
  grade: string | null;
  remarks: string | null;
};

export type ExamResultsRow = {
  student: { id: number; name: string; admission_number: string };
  average_marks: number | null;
  average_grade: string | null;
  average_percentage: number | null;
  lines: ExamResultLine[];
};

/** One exam block in `GET students/{id}/exam-performance` (student + admin). */
export type StudentExamPerformanceLine = {
  subject_id: number;
  subject_name: string | null;
  subject_code: string | null;
  max_marks: string;
  marks_obtained: string;
  grade: string | null;
  remarks: string | null;
};

export type StudentExamPerformanceBlock = {
  exam: {
    id: number;
    title: string;
    exam_date: string;
    max_marks: string;
    class: { id: number; name: string; section: string | null } | null;
  };
  average_marks: number;
  average_grade: string | null;
  average_percentage: number;
  subjects_count: number;
  lines: StudentExamPerformanceLine[];
};

/** Admin list row + student “for me” card (subset). */
export type OnlineExamSummaryRow = {
  id: number;
  class_id: number;
  title: string;
  type: string;
  is_published: boolean;
  questions_count: number;
  attempts_count: number;
  available_from: string | null;
  available_until: string | null;
  school_class: { id: number; name: string; section: string | null } | null;
};

export type OnlineExamQuestionRow = {
  id: number;
  online_exam_id: number;
  sort_order: number;
  prompt: string;
  options: string[];
  correct_index: number;
  points: string;
};

export type OnlineExamDetail = {
  id: number;
  class_id: number;
  title: string;
  type: string;
  description: string | null;
  is_published: boolean;
  available_from: string | null;
  available_until: string | null;
  duration_minutes: number;
  school_class: { id: number; name: string; section: string | null } | null;
  questions: OnlineExamQuestionRow[];
};

export type OnlineExamAttemptRow = {
  id: number;
  student: { id: number; name: string; admission_number: string } | null;
  score: string | null;
  max_score: string | null;
  percentage: number | null;
  submitted_at: string | null;
};

export type OnlineExamAnalyticsPerQuestion = {
  question_id: number;
  prompt_preview: string;
  points: string;
  correct_count: number;
  submitted_count: number;
  correct_rate_pct: number | null;
};

export type OnlineExamAnalyticsPayload = {
  exam_id: number;
  title: string;
  submitted_count: number;
  max_score: string;
  average_score: number | null;
  average_percentage: number | null;
  per_question: OnlineExamAnalyticsPerQuestion[];
};

export type StudentOnlineExamListItem = {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  questions_count: number;
  available_from: string | null;
  available_until: string | null;
  is_submitted: boolean;
  score: string | null;
  max_score: string | null;
};

export type InAppNotificationRow = {
  id: number;
  type: string | null;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type AttendanceSeriesPoint = {
  date: string;
  marked: number;
  present: number;
};

export type DashboardAdminStats = {
  students_count: number;
  teachers_count: number;
  classes_count: number;
  subjects_count: number;
  exams_upcoming: number;
  fee_summary: {
    pending_balance: number;
    unpaid_fee_records: number;
    paid_this_month: number;
  };
  attendance_series: AttendanceSeriesPoint[];
};

export type DashboardTeacherExam = {
  id: number;
  title: string;
  exam_date: string | null;
  class: { name: string; section: string | null } | null;
};

export type DashboardTeacherStats = {
  has_profile: boolean;
  message?: string;
  subjects_assigned?: number;
  classes_count?: number;
  students_reachable?: number;
  homeroom_classes?: number;
  unread_notifications?: number;
  attendance_series?: AttendanceSeriesPoint[];
  upcoming_exams?: DashboardTeacherExam[];
};

export type DashboardStudentStats = {
  has_profile: boolean;
  message?: string;
  student?: { id: number; name: string; admission_number: string };
  class?: { id: number; name: string; section: string | null } | null;
  attendance_rate_30d?: number | null;
  attendance_marked_30d?: number;
  fee_balance?: number;
  unread_notifications?: number;
  upcoming_exams?: Array<{ id: number; title: string; exam_date: string | null }>;
  recent_results?: Array<{
    exam_title: string | null;
    subject: string | null;
    marks: string;
    grade: string | null;
  }>;
};

export type DashboardStudentProgress = Omit<
  DashboardStudentStats,
  "has_profile" | "message" | "unread_notifications"
>;

export type DashboardParentStats = {
  has_children: boolean;
  message?: string;
  unread_notifications: number;
  children?: DashboardStudentProgress[];
};

export type GlobalSearchResults = {
  students: Array<{ id: number; name: string; admission_number: string }>;
  teachers: Array<{ id: number; employee_id: string; name: string | null }>;
  classes: Array<{
    id: number;
    name: string;
    section: string | null;
    academic_year: string | null;
  }>;
};

export function firstError(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null;
  }
  const first = Object.values(errors)[0];
  return first?.[0] ?? null;
}
