import { StudentOnlineExamTakeClient } from "@/components/online-exams/student-online-exam-take-client";

export default function OnlineExamTakePage({ params }: { params: { id: string } }) {
  return <StudentOnlineExamTakeClient examId={params.id} />;
}
