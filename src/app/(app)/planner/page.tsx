import { CalendarView } from "@/components/calendar-view";

export default function PlannerPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Planner</h1>
      <CalendarView />
    </div>
  );
}
