"use server";

import { intelligentScheduleRecommendation, IntelligentScheduleRecommendationOutput } from "@/ai/flows/intelligent-schedule-recommendation";
import { editSchedule, EditScheduleOutput } from "@/ai/flows/edit-schedule-flow";
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

  const subjectsToStudy = Object.entries(problemSummary)
    .map(
      ([subject, count]) =>
        `${subject}: ${count} problems solved so far.`
    )
    .join("\n");


  try {
    const result = await intelligentScheduleRecommendation({
      activityHistory: activityHistory || "No activity history yet.",
      preferredStudyTimes,
      subjects: subjectsToStudy || "No problems tracked yet. Base schedule on general good study habits.",
    });
    return { recommendation: result, error: null, message: "Successfully generated schedule!" };
  } catch (e: any) {
    console.error(e);
    // Genkit can sometimes wrap errors, so we'll check for a more specific message
    const errorMessage = e.cause?.message || e.message || "Failed to generate schedule. Please try again.";
    return { ...prevState, error: errorMessage };
  }
}

export async function refineScheduleAction(
  prevState: SchedulerState,
  formData: FormData
): Promise<SchedulerState> {
  const editInstruction = formData.get("editInstruction") as string;
  const currentScheduleStr = formData.get("currentSchedule") as string;

  if (!editInstruction) {
    return { ...prevState, error: "Please enter instructions to refine the schedule." };
  }

  if (!currentScheduleStr) {
    return { ...prevState, error: "No schedule to edit." };
  }
  
  const currentSchedule = JSON.parse(currentScheduleStr);

  try {
    const result = await editSchedule({
      currentSchedule,
      editInstruction,
    });
    
    // The EditScheduleOutput has an `updatedSchedule` property. We need to map it back to the `SchedulerState` shape.
    const newRecommendation: IntelligentScheduleRecommendationOutput = {
      scheduleRecommendation: result.updatedSchedule,
    };
    
    return { recommendation: newRecommendation, error: null, message: "Schedule updated!" };
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.cause?.message || e.message || "Failed to refine schedule. Please try again.";
    return { ...prevState, error: errorMessage };
  }
}
