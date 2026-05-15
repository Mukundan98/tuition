import { Suspense } from "react";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<AppPageLoader variant="section" className="min-h-[14rem] py-6" />}>
      <LoginForm />
    </Suspense>
  );
}
