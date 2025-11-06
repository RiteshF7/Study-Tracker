import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Dashboard</h1>
      <DashboardClient />
    </div>
  );
}
