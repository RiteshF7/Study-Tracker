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

const getNCERTPdfUrl = (subject: string, year: string, topicIndex: number, topicName: string): string => {
    const is11th = year === "11th";
    const is12th = year === "12th";

    // Base codes
    // Class 11: k, Class 12: l
    // English: e
    // Physics: ph, Chemistry: ch, Maths: mh, Biology: bo

    let code = "";
    let part = "1";
    let chapterNum = topicIndex + 1;

    if (subject === "Physics") {
        code = is11th ? "keph" : "leph";

        if (is11th) {
            // Class 11 Physics
            // Part 1: Ch 1-8 (Physical World - Gravitation)
            // Note: Syllabus often skips "Physical World" (Ch 1). 
            // If "Units and Measurements" is index 0, it maps to Ch 2.
            if (topicName.includes("Units")) chapterNum = 2;
            else if (topicName.includes("Straight Line")) chapterNum = 3;
            else if (topicName.includes("Plane")) chapterNum = 4;
            else if (topicName.includes("Laws of Motion")) chapterNum = 5;
            else if (topicName.includes("Work")) chapterNum = 6;
            else if (topicName.includes("Rotational")) chapterNum = 7;
            else if (topicName.includes("Gravitation")) chapterNum = 8;

            // Part 2: Ch 9-15
            else {
                part = "2";
                if (topicName.includes("Solids")) chapterNum = 1;
                else if (topicName.includes("Fluids")) chapterNum = 2;
                else if (topicName.includes("Thermal")) chapterNum = 3;
                else if (topicName.includes("Thermodynamics")) chapterNum = 4;
                else if (topicName.includes("Kinetic")) chapterNum = 5;
                else if (topicName.includes("Oscillations")) chapterNum = 6;
                else if (topicName.includes("Waves")) chapterNum = 7;
            }
        } else if (is12th) {
            // Class 12 Physics
            // Part 1: Ch 1-8
            if (topicIndex < 8) {
                part = "1";
                chapterNum = topicIndex + 1;
            } else {
                // Part 2: Ch 9-14 (Optics starts Part 2)
                part = "2";
                chapterNum = topicIndex - 7; // Index 8 (Optics) -> Ch 1
            }
        }
    } else if (subject === "Chemistry") {
        code = is11th ? "kech" : "lech";

        if (is11th) {
            // Class 11 Chemistry
            // Part 1: Ch 1-7 (Basic Concepts - Equilibrium)
            if (topicIndex < 7) {
                part = "1";
                chapterNum = topicIndex + 1;
            } else {
                // Part 2: Ch 8-14 (Redox - Env Chem)
                part = "2";
                chapterNum = topicIndex - 6; // Index 7 (Redox) -> Ch 1
            }
        } else if (is12th) {
            // Class 12 Chemistry
            // Part 1: Ch 1-9 (Solid State - Coordination)
            if (topicIndex < 9) {
                part = "1";
                chapterNum = topicIndex + 1;
            } else {
                // Part 2: Ch 10-16 (Haloalkanes - Everyday Life)
                part = "2";
                chapterNum = topicIndex - 8; // Index 9 (Haloalkanes) -> Ch 1
            }
        }
    } else if (subject === "Maths") {
        code = is11th ? "kemh" : "lemh";

        if (is11th) {
            // Class 11 Maths: Single book
            part = "1";
            chapterNum = topicIndex + 1;
        } else if (is12th) {
            // Class 12 Maths
            // Part 1: Ch 1-6 (Relations - App of Derivatives)
            if (topicIndex < 6) {
                part = "1";
                chapterNum = topicIndex + 1;
            } else {
                // Part 2: Ch 7-13 (Integrals - Probability)
                part = "2";
                chapterNum = topicIndex - 5; // Index 6 (Integrals) -> Ch 1
            }
        }
    } else if (subject === "Biology") {
        code = is11th ? "kebo" : "lebo";
        part = "1"; // Biology is usually single part
        chapterNum = topicIndex + 1;
    }

    if (!code) return "#"; // Fallback for BPT or unknown

    // Format chapter number to 2 digits (e.g., 01, 02)
    const formattedChapter = chapterNum.toString().padStart(2, '0');

    return `https://ncert.nic.in/textbook/pdf/${code}${part}${formattedChapter}.pdf`;
};

// Helper to generate resources
const generateResources = (course: string, year: string, subject: string, topics: string[]): SubjectResources => {
    return {
        NCERT: topics.map((topic, index) => ({
            title: `${topic}`,
            url: getNCERTPdfUrl(subject, year, index, topic)
        })),
        Exemplar: topics.map(topic => ({ title: `${topic} - Exemplar`, url: `https://ncert.nic.in/exemplar-problems.php?ln=en` })), // Generic link for now
        Solutions: topics.map(topic => ({ title: `${topic} - Solutions`, url: "#" }))
    };
};

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
            // Handle Dropper by mapping to 11th/12th logic if needed, but for now we pass "yearKey"
            // If yearKey is "Dropper", the getNCERTPdfUrl will fail (returns #). 
            // We might need a smarter mapping for Dropper to split topics into 11th/12th.
            // For simplicity in this iteration, we'll focus on 11th/12th.

            LIBRARY_DATA[courseKey][yearKey][subjectKey] = generateResources(courseKey, yearKey, subjectKey, topics);
        });
    });
});
