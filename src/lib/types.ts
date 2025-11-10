
import { Timestamp } from "firebase/firestore";

export type Activity = {
  id?: string;
  name: string;
  type: 'Study' | 'Class' | 'Break' | 'Other';
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  createdAt: Timestamp;
  userId: string;
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

export type Problem = {
  id?: string;
  name: string;
  count: number;
  notes: string;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  userId: string;
};

export type Todo = {
  id?: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  dueDate?: string; // YYYY-MM-DD
  userId: string;
};


export const activityTypes = ["Study", "Class", "Break", "Other"];
