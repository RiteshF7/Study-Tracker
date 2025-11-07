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
  const selectedSubjects = formData.getAll("subjects") as string[];

  if (!preferredStudyTimes) {
    return { ...prevState, error: "Please enter your preferred study times." };
  }

  // Format data for AI
  const activityHistory = activities
    .map(
      (a) => `On ${a.date}, I did '${a.name}' (${a.type}) for ${a.duration} minutes.`
    )
    .join("\n");
  
  let subjectsToStudy: string;

  if (selectedSubjects.length > 0) {
    subjectsToStudy = `The user wants to focus on the following subjects: ${selectedSubjects.join(', ')}. Please create a schedule that includes study time for these subjects.`;
  } else {
    const problemSummary = problems.reduce((acc, p) => {
      acc[p.subject] = (acc[p.subject] || 0) + p.count;
      return acc;
    }, {} as Record<string, number>);
  
    const subjectBreakdown = Object.entries(problemSummary)
      .map(
        ([subject, count]) =>
          `${subject}: ${count} problems solved so far.`
      )
      .join("\n");
    
    subjectsToStudy = `Base the study subjects on the following problem history:\n${subjectBreakdown || "No problems tracked yet."}`;
  }


  try {
    const result = await intelligentScheduleRecommendation({
      activityHistory: activityHistory || "No activity history yet.",
      preferredStudyTimes,
      subjects: subjectsToStudy,
    });
    return { recommendation: result, error: null, message: "Successfully generated schedule!" };
  } catch (e) {
    console.error(e);
    return { ...prevState, error: "Failed to generate schedule. Please try again." };
  }
}
