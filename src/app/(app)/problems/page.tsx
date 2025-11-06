import { ProblemTracker } from "@/components/problem-tracker";

export default function ProblemsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Problem Tracker</h1>
      <ProblemTracker />
    </div>
  );
}
