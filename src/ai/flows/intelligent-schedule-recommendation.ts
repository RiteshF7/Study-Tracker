'use server';

/**
 * @fileOverview An intelligent schedule recommendation AI agent.
 *
 * - intelligentScheduleRecommendation - A function that provides schedule recommendations based on past study patterns.
 * - IntelligentScheduleRecommendationInput - The input type for the intelligentScheduleRecommendation function.
 * - IntelligentScheduleRecommendationOutput - The return type for the intelligentScheduleRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentScheduleRecommendationInputSchema = z.object({
  activityHistory: z.string().describe("A summary of the user's past activities, including study sessions, classes, and breaks."),
  preferredStudyTimes: z.string().describe("The user's stated preferences for study times, including any constraints or fixed appointments."),
  subjects: z.string().describe("A list of subjects the user is studying, potentially with notes on their progress."),
});
export type IntelligentScheduleRecommendationInput = z.infer<typeof IntelligentScheduleRecommendationInputSchema>;

const IntelligentScheduleRecommendationOutputSchema = z.object({
  scheduleRecommendation: z
    .array(
      z.object({
        time: z.string().describe("The time slot for the activity (e.g., '7:00 AM - 8:00 AM')."),
        activity: z.string().describe("The recommended activity for the time slot. Be concise and to the point."),
      })
    )
    .describe('The recommended study schedule as an array of time slots and activities.'),
  reasoning: z
    .array(
      z.object({
        point: z.string().describe("The name of the scheduling principle applied (e.g., 'Productivity Peak')."),
        explanation: z.string().describe('A brief explanation of why this principle was used for the schedule.'),
      })
    )
    .describe('An explanation of the principles used to create the schedule.')
    .optional(),
});
export type IntelligentScheduleRecommendationOutput = z.infer<typeof IntelligentScheduleRecommendationOutputSchema>;


export async function intelligentScheduleRecommendation(
  input: IntelligentScheduleRecommendationInput
): Promise<IntelligentScheduleRecommendationOutput> {
  return intelligentScheduleRecommendationFlow(input);
}


const prompt = ai.definePrompt({
  name: 'intelligentScheduleRecommendationPrompt',
  input: {schema: IntelligentScheduleRecommendationInputSchema},
  output: {schema: IntelligentScheduleRecommendationOutputSchema},
  prompt: `You are an expert productivity coach and academic advisor for a student. Your goal is to create an optimal, personalized daily study schedule.

Analyze the user's activity history, their stated preferences, and their subjects of study to create a balanced and effective schedule.

**User Information:**
- **Past Activities**: 
{{{activityHistory}}}
- **Preferences and Constraints**: "{{preferredStudyTimes}}"
- **Subjects to Focus On**: 
{{{subjects}}}

**Your Task:**
1.  Create a detailed, hour-by-hour schedule for a single day.
2.  Incorporate study blocks, breaks, and any fixed appointments mentioned by the user.
3.  Prioritize subjects based on the user's history, but ensure a balanced approach.
4.  Apply productivity principles like spacing out difficult subjects and scheduling breaks to avoid burnout.
5.  Provide a brief reasoning for your schedule, explaining 2-3 key principles you applied (e.g., "I scheduled Math in the morning as you seem to be most productive then," or "I added a break after a long study session to improve focus.").

Return the schedule and reasoning in the specified JSON format.
`,
});

const intelligentScheduleRecommendationFlow = ai.defineFlow(
  {
    name: 'intelligentScheduleRecommendationFlow',
    inputSchema: IntelligentScheduleRecommendationInputSchema,
    outputSchema: IntelligentScheduleRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
