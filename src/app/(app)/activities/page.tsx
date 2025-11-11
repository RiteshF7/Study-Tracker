
import { ActivityLog } from "@/components/activity-log";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ManualActivityForm } from "@/components/manual-activity-form";

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-headline">Activity Tracker</h1>
          <p className="text-muted-foreground">Log your study sessions and track your progress over time.</p>
        </div>
        <div className="flex items-center gap-2">
            <ManualActivityForm />
            <Button asChild size="lg">
            <Link href="/dashboard">
                <PlusCircle className="mr-2 h-5 w-5" />
                Start Live Session
            </Link>
            </Button>
        </div>
      </div>
      <ActivityLog />
    </div>
  );
}
