'use server';

/**
 * @fileOverview An AI agent for editing a study schedule.
 *
 * - editSchedule - A function that refines an existing schedule based on user instructions.
 * - EditScheduleInput - The input type for the editSchedule function.
 * - EditScheduleOutput - The return type for the editSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScheduleItemSchema = z.object({
  time: z.string().describe("The time slot for the activity (e.g., '7:00 AM - 8:00 AM')."),
  activity: z.string().describe("The recommended activity for the time slot. Be concise and to the point."),
});

const EditScheduleInputSchema = z.object({
  currentSchedule: z.array(ScheduleItemSchema).describe('The current study schedule that needs to be modified.'),
  editInstruction: z.string().describe('The user\'s instruction on how to modify the schedule.'),
});

export type EditScheduleInput = z.infer<typeof EditScheduleInputSchema>;

const EditScheduleOutputSchema = z.object({
  updatedSchedule: z.array(ScheduleItemSchema).describe('The modified study schedule as an array of time slots and activities.'),
});

export type EditScheduleOutput = z.infer<typeof EditScheduleOutputSchema>;

export async function editSchedule(
  input: EditScheduleInput
): Promise<EditScheduleOutput> {
  return editScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editSchedulePrompt',
  input: {schema: EditScheduleInputSchema},
  output: {schema: EditScheduleOutputSchema},
  prompt: `You are an AI assistant that modifies a student's study schedule based on their instructions.

Analyze the current schedule and the user's instruction to provide an updated schedule.

Current Schedule:
{{#each currentSchedule}}
- {{time}}: {{activity}}
{{/each}}

User's Instruction: "{{editInstruction}}"

Return the complete, updated schedule in the exact same format as the original. Only modify what is requested.
`,
});

const editScheduleFlow = ai.defineFlow(
  {
    name: 'editScheduleFlow',
    inputSchema: EditScheduleInputSchema,
    outputSchema: EditScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
