import { SYLLABUS } from "./syllabus";

export type ResourceType = "NCERT" | "Exemplar" | "Solutions";

export interface ResourceLink {
    title: string;
    url: string;
}

export interface SubjectResources {
    NCERT: ResourceLink[];
    Exemplar: ResourceLink[];
    Solutions: ResourceLink[];
}

// Helper to generate placeholder resources based on syllabus topics
const generateResources = (topics: string[]): SubjectResources => {
    return {
        NCERT: topics.map(topic => ({ title: `${topic} - Textbook`, url: "#" })),
        Exemplar: topics.map(topic => ({ title: `${topic} - Exemplar Problems`, url: "#" })),
        Solutions: topics.map(topic => ({ title: `${topic} - Solutions`, url: "#" }))
    };
};

// We can reconstruct the structure dynamically from SYLLABUS or hardcode specific overrides
// For now, let's build a structure that mirrors SYLLABUS but with ResourceLink[]
export const LIBRARY_DATA: any = {};

// Populate LIBRARY_DATA based on SYLLABUS
Object.keys(SYLLABUS).forEach((courseKey) => {
    // @ts-ignore
    const courseData = SYLLABUS[courseKey];
    LIBRARY_DATA[courseKey] = {};

    Object.keys(courseData).forEach((yearKey) => {
        const yearData = courseData[yearKey];
        LIBRARY_DATA[courseKey][yearKey] = {};

        Object.keys(yearData).forEach((subjectKey) => {
            const topics = yearData[subjectKey];
            LIBRARY_DATA[courseKey][yearKey][subjectKey] = generateResources(topics);
        });
    });
});
