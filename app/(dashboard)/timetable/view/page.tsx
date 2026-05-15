"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppPageLoader } from "@/components/layout/app-page-loader";
import { TimetableAdminViewClient } from "@/components/timetable/timetable-admin-view-client";

export default function TimetableViewPage() {
    const { user, status } = useAuth();
    const router = useRouter();
    const slug = user?.role?.slug;

    useEffect(() => {
        if (status !== "authed" || !user) return;
        if (slug !== "admin") {
            router.replace("/timetable");
        }
    }, [status, user, slug, router]);

    if (status !== "authed" || !user) {
        return <AppPageLoader variant="fullscreen" />;
    }

    if (slug !== "admin") {
        return <AppPageLoader variant="fullscreen" />;
    }

    return (
        <div className="mx-auto max-w-[100rem] p-4 md:p-6">
            <TimetableAdminViewClient />
        </div>
    );
}
