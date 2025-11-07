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
  "None",
];

export const courses = {
  "BPT": {
    "First Year": [
      "Human Anatomy", "Human Physiology", "Biochemistry", "Psychology", "Sociology", 
      "English / Communication Skills", "Introduction to Physiotherapy", "None"
    ],
    "Second Year": [
      "Pathology", "Microbiology", "Pharmacology", "Exercise Therapy", "Electrotherapy", 
      "Biomechanics & Kinesiology", "Research Methodology & Biostatistics", "None"
    ],
    "Third Year": [
      "General Medicine", "General Surgery", "Orthopaedics & Traumatology", "Neurology & Neurosurgery", 
      "Cardio-Respiratory Conditions", "Community-Based Rehabilitation", "Diagnostic Imaging for Physiotherapists", "None"
    ],
    "Fourth Year": [
      "Physiotherapy in Orthopaedic Conditions", "Physiotherapy in Neurological Conditions", 
      "Physiotherapy in Cardiopulmonary Conditions", "Sports Physiotherapy", "Geriatric Physiotherapy", 
      "Pediatric Physiotherapy", "Women’s Health & Obstetrics Physiotherapy", 
      "Ethics, Administration & Management in Physiotherapy", "None"
    ],
    "Internship": [
      "Orthopaedics", "Neurology", "Cardio-respiratory", "Pediatrics", "Community Health", "ICU and Surgical Wards", "None"
    ]
  },
  "MPT": {
    "First Year": [
      "Principles of Physiotherapy Practice",
      "Physiotherapeutic Techniques & Approaches",
      "Research Methodology & Biostatistics",
      "Applied Biomechanics & Kinesiology",
      "Exercise Physiology",
      "Electrophysiology",
      "Clinical Training (Specialization-specific)",
      "Seminar & Case Presentations",
      "None"
    ],
    "Second Year": [
      "Advanced Physiotherapy in Specialization",
      "Evidence-Based Practice in Physiotherapy",
      "Dissertation / Thesis Work",
      "Clinical Posting & Logbook",
      "Teaching Methodology & Professional Ethics",
      "Advanced Diagnostic & Therapeutic Techniques",
      "Seminar & Journal Club",
      "Final Practical & Viva Voce",
      "None"
    ],
    "Optional Modules": [
      "Ergonomics & Workplace Assessment",
      "Manual Therapy & Taping Techniques",
      "Robotics & Technology in Rehabilitation",
      "Advanced Pain Management",
      "Tele-Physiotherapy & Digital Health",
      "None"
    ]
  },
  "MBBS": {
    "All Subjects": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology", "Forensic Medicine", "Ophthalmology", "Surgery", "Pediatrics", "Other", "None"],
  },
  "BSc": {
    "All Subjects": ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "Botany", "Zoology", "Statistics", "Other", "None"],
  },
  "MSc": {
    "All Subjects": ["Advanced Physics", "Organic Chemistry", "Molecular Biology", "Applied Mathematics", "Data Science", "Environmental Science", "Biotechnology", "Other", "None"],
  },
  "BDS": {
    "All Subjects": ["Dental Anatomy", "Oral Pathology", "Periodontology", "Orthodontics", "Prosthodontics", "Endodontics", "Oral Surgery", "Community Dentistry", "Other", "None"],
  },
  "BAMS": {
    "All Subjects": ["Ayurvedic Principles", "Dravyaguna", "Rasa Shastra", "Panchakarma", "Shalya Tantra", "Shalakya Tantra", "Prasuti Tantra", "Kaumarabhritya", "Other", "None"],
  },
  "General Studies": {
    "All Subjects": defaultSubjects,
  }
};

export type CourseName = keyof typeof courses;
export type YearName<T extends CourseName> = keyof (typeof courses)[T];


export const activityTypes = ["Study", "Class", "Break", "Other"];
