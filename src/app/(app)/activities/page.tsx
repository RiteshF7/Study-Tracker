import { ActivityLog } from "@/components/activity-log";

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Activity Log</h1>
      <ActivityLog />
    </div>
  );
}
