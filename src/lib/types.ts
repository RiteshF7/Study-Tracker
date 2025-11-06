export type Activity = {
  id: string;
  name: string;
  type: 'Study' | 'Class' | 'Break' | 'Other';
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
};

export type Problem = {
  id: string;
  subject: string;
  count: number;
  notes: string;
  date: string; // YYYY-MM-DD
};

export const problemSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "Literature",
  "Other",
];

export const activityTypes = ["Study", "Class", "Break", "Other"];
