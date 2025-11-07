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
  activityHistory: z
    .string()
    .describe(
      'A detailed log of past study activities, including subjects, time spent, and self-assessed productivity levels.'
    ),
  preferredStudyTimes: z
    .string()
    .describe(
      'The student’s preferred study times and any constraints on their availability.'
    ),
  subjects: z
    .string()
    .describe(
      'List of subjects with the amount of time that needs to be spent on each of them.'
    ),
});

export type IntelligentScheduleRecommendationInput = z.infer<
  typeof IntelligentScheduleRecommendationInputSchema
>;

const ScheduleItemSchema = z.object({
  time: z.string().describe("The time slot for the activity (e.g., '7:00 AM - 8:00 AM')."),
  activity: z.string().describe("The recommended activity for the time slot. Be concise and to the point."),
});

const ReasoningItemSchema = z.object({
  point: z.string().describe("The core principle or strategy behind the recommendation (e.g., 'Morning Focus', 'Strategic Breaks')."),
  explanation: z.string().describe("A detailed explanation of why this point is important for the student's schedule."),
});


const IntelligentScheduleRecommendationOutputSchema = z.object({
  scheduleRecommendation: z.array(ScheduleItemSchema).describe('Recommended study schedule as an array of time slots and activities.'),
  reasoning: z.array(ReasoningItemSchema).describe('A structured array of key points explaining the reasoning behind the schedule.'),
});

export type IntelligentScheduleRecommendationOutput = z.infer<
  typeof IntelligentScheduleRecommendationOutputSchema
>;

export async function intelligentScheduleRecommendation(
  input: IntelligentScheduleRecommendationInput
): Promise<IntelligentScheduleRecommendationOutput> {
  return intelligentScheduleRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentScheduleRecommendationPrompt',
  input: {schema: IntelligentScheduleRecommendationInputSchema},
  output: {schema: IntelligentScheduleRecommendationOutputSchema},
  prompt: `You are an AI assistant that provides personalized study schedule recommendations for students based on their past study patterns and preferences.

Analyze the following activity history, preferred study times, and subjects to recommend an optimized study schedule.

Activity History: {{{activityHistory}}}
Preferred Study Times: {{{preferredStudyTimes}}}
Subjects: {{{subjects}}}

Provide a schedule recommendation as a structured list that is concise and to the point.
Then, provide a structured list of reasons for your recommendations. Each reason should have a key point and a detailed explanation.
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
