
import { subDays, format } from 'date-fns';
import type { Activity, Problem } from './types';
import { activityTypes } from './types';
import { Timestamp } from 'firebase/firestore';

function getRandomElement<T>(arr: T[]): T {
  const array = arr.filter(item => item !== 'Other');
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const mockActivityNames = ["Physics Review", "Calculus Homework", "Biology Notes", "Chemistry Lab Report"];

export function generateMockActivities(days: number): Activity[] {
  const activities: Activity[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const numActivities = getRandomNumber(1, 3); // 1 to 3 activities per day

    for (let j = 0; j < numActivities; j++) {
      const type = getRandomElement(activityTypes as unknown as string[]);
      const duration = getRandomNumber(20, 120); // 20 to 120 minutes
      const name = type === 'Study' ? getRandomElement(mockActivityNames) : `${type} Session`;
      
      activities.push({
        id: `mock-activity-${i}-${j}`,
        name: name,
        type: type as Activity['type'],
        duration,
        date: format(date, 'yyyy-MM-dd'),
        createdAt: Timestamp.fromDate(date),
        userId: 'mock-user',
      });
    }
  }
  return activities;
}

export function generateMockProblems(days: number): Problem[] {
  const problems: Problem[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const numEntries = getRandomNumber(0, 2); // 0 to 2 problem entries per day

    for (let j = 0; j < numEntries; j++) {
      const name = getRandomElement(mockActivityNames);
      const count = getRandomNumber(3, 15); // 3 to 15 problems

      problems.push({
        id: `mock-problem-${i}-${j}`,
        name,
        count,
        notes: 'Completed practice set.',
        date: format(date, 'yyyy-MM-dd'),
        createdAt: Timestamp.fromDate(date),
        userId: 'mock-user',
      });
    }
  }
  return problems;
}
