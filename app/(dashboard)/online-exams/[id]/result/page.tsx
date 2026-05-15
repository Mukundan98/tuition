import { StudentOnlineExamResultClient } from "@/components/online-exams/student-online-exam-result-client";

export default function OnlineExamResultPage({ params }: { params: { id: string } }) {
  return <StudentOnlineExamResultClient examId={params.id} />;
}
