export const XP_PER_MINUTE = 10;

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name or path
    unlockedAt?: string; // ISO Date
}

export interface UserProfile {
    uid: string;
    xp: number;
    level: number;
    badges: Badge[];
    dailyGoal?: number; // Minutes
}

export const LEVELS = [
    { level: 1, minXp: 0, title: "Novice" },
    { level: 2, minXp: 500, title: "Apprentice" }, // ~50 mins
    { level: 3, minXp: 1500, title: "Scholar" }, // ~2.5 hours
    { level: 4, minXp: 3000, title: "Adept" }, // ~5 hours
    { level: 5, minXp: 6000, title: "Expert" }, // ~10 hours
    { level: 6, minXp: 10000, title: "Master" }, // ~16 hours
    { level: 7, minXp: 20000, title: "Grandmaster" }, // ~33 hours
    { level: 8, minXp: 50000, title: "Legend" }, // ~83 hours
];

export function calculateLevel(xp: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXp) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

export function getNextLevel(currentLevel: number) {
    return LEVELS.find(l => l.level === currentLevel + 1);
}
export const BADGES = [
    { id: 'night_owl', name: 'Night Owl', description: 'Complete a study session after 10 PM', icon: 'Moon' },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete a study session before 7 AM', icon: 'Sun' },
    { id: 'marathoner', name: 'Marathoner', description: 'Study for more than 4 hours in one session', icon: 'Timer' },
    { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Study on a Saturday or Sunday', icon: 'Calendar' },
    { id: 'first_step', name: 'First Step', description: 'Complete your first study session', icon: 'Footprints' },
];

export function checkBadges(currentActivity: { duration: number; startTime: string; date: string }, existingBadges: Badge[] = []) {
    const newBadges: Badge[] = [];
    const existingIds = new Set(existingBadges.map(b => b.id));

    const activityDate = new Date(`${currentActivity.date}T${currentActivity.startTime}`);
    const hour = activityDate.getHours();
    const day = activityDate.getDay(); // 0 = Sunday, 6 = Saturday

    // First Step
    if (!existingIds.has('first_step')) {
        newBadges.push({ ...BADGES.find(b => b.id === 'first_step')!, unlockedAt: new Date().toISOString() });
    }

    // Night Owl (After 10 PM / 22:00)
    if (hour >= 22 && !existingIds.has('night_owl')) {
        newBadges.push({ ...BADGES.find(b => b.id === 'night_owl')!, unlockedAt: new Date().toISOString() });
    }

    // Early Bird (Before 7 AM)
    if (hour < 7 && !existingIds.has('early_bird')) {
        newBadges.push({ ...BADGES.find(b => b.id === 'early_bird')!, unlockedAt: new Date().toISOString() });
    }

    // Marathoner (4 hours = 240 minutes)
    if (currentActivity.duration >= 240 && !existingIds.has('marathoner')) {
        newBadges.push({ ...BADGES.find(b => b.id === 'marathoner')!, unlockedAt: new Date().toISOString() });
    }

    // Weekend Warrior
    if ((day === 0 || day === 6) && !existingIds.has('weekend_warrior')) {
        newBadges.push({ ...BADGES.find(b => b.id === 'weekend_warrior')!, unlockedAt: new Date().toISOString() });
    }

    return newBadges;
}
