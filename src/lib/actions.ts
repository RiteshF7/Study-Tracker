
"use server";

import { intelligentScheduleRecommendation, IntelligentScheduleRecommendationOutput } from "@/ai/flows/intelligent-schedule-recommendation";
import { editSchedule, EditScheduleOutput } from "@/ai/flows/edit-schedule-flow";
import type { Activity, Problem, Todo } from "@/lib/types";
import { getFirestore } from "firebase-admin/firestore";
import { app } from '@/firebase/server';


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

  if (!preferredStudyTimes) {
    return { ...prevState, error: "Please enter your preferred study times." };
  }

  // Format data for AI
  const activityHistory = activities
    .map(
      (a) => `On ${a.date}, I did '${a.name}' (${a.type}) for ${a.duration} minutes.`
    )
    .join("\n");


  try {
    const result = await intelligentScheduleRecommendation({
      activityHistory: activityHistory || "No activity history yet.",
      preferredStudyTimes,
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

export type AddToTodoState = {
    error?: string | null;
    message?: string | null;
}

export async function addScheduleToTodos(
    prevState: AddToTodoState,
    formData: FormData
): Promise<AddToTodoState> {
    const scheduleStr = formData.get("schedule") as string;
    const userId = formData.get("userId") as string;

    if (!scheduleStr || !userId) {
        return { error: "Missing required data." };
    }

    const schedule = JSON.parse(scheduleStr);

    try {
        const db = getFirestore(app);
        const todosCollection = db.collection("users").doc(userId).collection("todos");
        const batch = db.batch();

        schedule.forEach((item: { time: string; activity: string }) => {
            const newTodoRef = todosCollection.doc();
            const todo: Omit<Todo, 'id'> = {
                title: `${item.activity} (${item.time})`,
                completed: false,
                userId: userId,
                createdAt: new Date() as any, // Firestore admin SDK handles Timestamps
            };
            batch.set(newTodoRef, todo);
        });

        await batch.commit();

        return { message: "Schedule successfully added to your to-do list!" };
    } catch (e: any) {
        console.error("Failed to add schedule to todos:", e);
        return { error: "Failed to add schedule to to-do list. " + (e as Error).message };
    }
}
