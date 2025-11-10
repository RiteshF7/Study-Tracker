
"use client";

import { CalendarView } from "@/components/calendar-view";
import { TodoList } from "@/components/todo-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlannerPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Planner</h1>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="todo">To-Do List</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>
        <TabsContent value="todo" className="mt-4">
          <TodoList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
