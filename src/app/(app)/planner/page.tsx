
import { CalendarView } from "@/components/calendar-view";
import { TodoList } from "@/components/todo-list";

export default function PlannerPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6 font-headline">Planner</h1>
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
            <CalendarView />
            <TodoList />
        </div>
      </div>
    </div>
  );
}
