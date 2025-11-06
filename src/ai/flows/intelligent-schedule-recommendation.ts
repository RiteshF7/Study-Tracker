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

const IntelligentScheduleRecommendationOutputSchema = z.object({
  scheduleRecommendation: z.string().describe('Recommended study schedule.'),
  reasoning: z
    .string()
    .describe(
      'Explanation of why the schedule was recommended, based on the activity history and preferred study times.'
    ),
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

Provide a schedule recommendation that maximizes learning efficiency and maintains a balanced schedule. Explain the reasoning behind the recommendations.

Schedule Recommendation:`,
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
