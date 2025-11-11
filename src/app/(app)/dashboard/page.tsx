import { DashboardClient } from "@/components/dashboard-client";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div className="text-center">Loading dashboard...</div>}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
