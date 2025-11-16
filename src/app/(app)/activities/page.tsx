
import { ActivityLog } from "@/components/activity-log";

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-headline">Track</h1>
          <p className="text-muted-foreground">Log your activities and track your progress over time.</p>
        </div>
      </div>
      <ActivityLog />
    </div>
  );
}
