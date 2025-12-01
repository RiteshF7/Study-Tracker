
import { Timestamp } from "firebase/firestore";

export type Activity = {
  id?: string;
  name: string;
  type: 'Study' | 'Class' | 'Break' | 'Other' | 'RED' | 'YELLOW' | 'GREEN';
  category?: string;
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  createdAt: Timestamp;
  userId: string;
  tags?: string[];
};

export type Problem = {
  id?: string;
  name: string;
  category: string;
  count: number;
  notes: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  userId: string;
};

export type JournalEntry = {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  summary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ProblemCategory = {
  id: string;
  name: string;
}

export const defaultProblemCategories: ProblemCategory[] = [
  { id: 'math', name: 'Mathematics' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'history', name: 'History' },
];

export type Todo = {
  id?: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  dueDate?: string; // YYYY-MM-DD
  userId: string;
};


export const activityTypes = ["Study", "Class", "Break", "Other", "RED", "YELLOW", "GREEN"];



