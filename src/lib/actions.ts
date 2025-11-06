"use server";

import { intelligentScheduleRecommendation, IntelligentScheduleRecommendationOutput } from "@/ai/flows/intelligent-schedule-recommendation";
import type { Activity, Problem } from "@/lib/types";

export type SchedulerState = {
  recommendation?: IntelligentScheduleRecommendationOutput | null;
  error?: string | null;
  message?: string | null;
};

export async function getScheduleRecommendation(
  prevState: SchedulerState,
  formData: FormData
): Promise<SchedulerState> {
  const preferredStudyTimes = formData.get("preferredStudyTimes") as string;
  const activities = JSON.parse(
    (formData.get("activities") as string) || "[]"
  ) as Activity[];
  const problems = JSON.parse(
    (formData.get("problems") as string) || "[]"
  ) as Problem[];

  if (!preferredStudyTimes) {
    return { ...prevState, error: "Please enter your preferred study times." };
  }

  // Format data for AI
  const activityHistory = activities
    .map(
      (a) => `On ${a.date}, I did '${a.name}' (${a.type}) for ${a.duration} minutes.`
    )
    .join("\n");

  const problemSummary = problems.reduce((acc, p) => {
    acc[p.subject] = (acc[p.subject] || 0) + p.count;
    return acc;
  }, {} as Record<string, number>);

  const subjects = Object.entries(problemSummary)
    .map(
      ([subject, count]) =>
        `${subject}: ${count} problems solved so far.`
    )
    .join("\n");
  
  const subjectsToStudy = Object.keys(problemSummary).join(', ');


  try {
    const result = await intelligentScheduleRecommendation({
      activityHistory: activityHistory || "No activity history yet.",
      preferredStudyTimes,
      subjects: subjects || "No problems tracked yet.",
    });
    return { recommendation: result, error: null, message: "Successfully generated schedule!" };
  } catch (e) {
    console.error(e);
    return { ...prevState, error: "Failed to generate schedule. Please try again." };
  }
}
