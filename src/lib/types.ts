import { Timestamp } from "firebase/firestore";

export type Activity = {
  id?: string;
  name: string;
  type: 'Study' | 'Class' | 'Break' | 'Other';
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  userId: string;
};

export type Problem = {
  id?: string;
  subject: string;
  count: number;
  notes: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  userId: string;
};

export const defaultSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "Literature",
  "Other",
];

export const courses = {
  "General Studies": {
    subjects: defaultSubjects,
  },
  "Pre-Med": {
    subjects: ["Biology", "Chemistry", "Organic Chemistry", "Physics", "Biochemistry", "Psychology", "Sociology", "Other"],
  },
  "Computer Science": {
    subjects: ["Data Structures", "Algorithms", "Operating Systems", "Computer Networks", "Database Systems", "Artificial Intelligence", "Mathematics", "Other"],
  },
  "History Major": {
    subjects: ["World History", "American History", "European History", "Ancient Civilizations", "Political Science", "Art History", "Literature", "Other"],
  }
};

export type CourseName = keyof typeof courses;

export const activityTypes = ["Study", "Class", "Break", "Other"];
