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
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Pharmacology",
  "Pathology",
  "Microbiology",
  "Forensic Medicine",
  "Community Medicine",
];

export const courses = {
  "BPT": {
    subjects: [
        "Human Anatomy",
        "Human Physiology",
        "Biochemistry",
        "Psychology",
        "Sociology",
        "English / Communication Skills",
        "Introduction to Physiotherapy",
        "Pathology",
        "Microbiology",
        "Pharmacology",
        "Exercise Therapy",
        "Electrotherapy",
        "Biomechanics & Kinesiology",
        "Research Methodology & Biostatistics",
        "General Medicine",
        "General Surgery",
        "Orthopaedics & Traumatology",
        "Neurology & Neurosurgery",
        "Cardio-Respiratory Conditions",
        "Community-Based Rehabilitation",
        "Diagnostic Imaging for Physiotherapists",
        "Physiotherapy in Orthopaedic Conditions",
        "Physiotherapy in Neurological Conditions",
        "Physiotherapy in Cardiopulmonary Conditions",
        "Sports Physiotherapy",
        "Geriatric Physiotherapy",
        "Pediatric Physiotherapy",
        "Women’s Health & Obstetrics Physiotherapy",
        "Ethics, Administration & Management in Physiotherapy",
        "Other"
    ],
  },
  "MPT": {
    subjects: ["Advanced Physiotherapy", "Research Methodology", "Biomechanics", "Manual Therapy", "Sports Physiotherapy", "Neuro-rehabilitation", "Cardio-rehabilitation", "Other"],
  },
  "MBBS": {
    subjects: ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology", "Forensic Medicine", "Ophthalmology", "Surgery", "Pediatrics", "Other"],
  },
  "BSc": {
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "Botany", "Zoology", "Statistics", "Other"],
  },
  "MSc": {
    subjects: ["Advanced Physics", "Organic Chemistry", "Molecular Biology", "Applied Mathematics", "Data Science", "Environmental Science", "Biotechnology", "Other"],
  },
  "BDS": {
    subjects: ["Dental Anatomy", "Oral Pathology", "Periodontology", "Orthodontics", "Prosthodontics", "Endodontics", "Oral Surgery", "Community Dentistry", "Other"],
  },
  "BAMS": {
    subjects: ["Ayurvedic Principles", "Dravyaguna", "Rasa Shastra", "Panchakarma", "Shalya Tantra", "Shalakya Tantra", "Prasuti Tantra", "Kaumarabhritya", "Other"],
  },
  "General Studies": {
    subjects: defaultSubjects,
  }
};

export type CourseName = keyof typeof courses;

export const activityTypes = ["Study", "Class", "Break", "Other"];
