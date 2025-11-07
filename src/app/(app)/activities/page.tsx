import { ActivityLog } from "@/components/activity-log";
import { ActivityTimer } from "@/components/activity-timer";

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 font-headline">Activity Tracker</h1>
        <p className="text-muted-foreground">Start the timer to log a new study session in real-time.</p>
      </div>
      <ActivityTimer />
      <ActivityLog />
    </div>
  );
}
