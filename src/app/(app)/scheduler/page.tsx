import { AiScheduler } from "@/components/ai-scheduler";

export default function SchedulerPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6 font-headline">AI Scheduler</h1>
        <AiScheduler />
      </div>
    </div>
  );
}
