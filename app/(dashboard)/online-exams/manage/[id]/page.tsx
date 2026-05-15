import { OnlineExamManageClient } from "@/components/online-exams/online-exam-manage-client";

export default function OnlineExamManagePage({ params }: { params: { id: string } }) {
  return <OnlineExamManageClient examId={params.id} />;
}
