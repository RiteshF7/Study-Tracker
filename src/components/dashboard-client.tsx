
"use client";

import type { Activity, Problem } from "@/lib/types";
import { useMemo, useState } from "react";
import { format, subDays, parseISO, startOfDay, differenceInDays } from "date-fns";
import { BarChart3, Clock, Target, TrendingUp, Goal, CheckCircle, ChevronDown, Flame, ChevronLeft, ChevronRight, Trophy, Pencil } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { GamificationCard } from "./gamification-card";
import { StatsCards } from "./stats-cards";
import { ActivityHistory } from "./activity-history";
import { generateMockActivities } from "@/lib/mock-data";
import { TodaysFocusCard } from "./todays-focus-card";
import { StreakCard } from "./streak-card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ActivityTimer } from "./activity-timer";
import { LiveSessionCard } from "./live-session-card";

type UserProfile = {
  name?: string;
  learningGoals?: string;
  targetHours?: number;
}

export function DashboardClient() {
  const { firestore, user } = useFirebase();

  const [isTiming, setIsTiming] = useState(false);
  const [timerConfig, setTimerConfig] = useState({
    mode: 'timer' as 'timer' | 'stopwatch',
    activityName: '',
    activityType: 'Study' as Activity['type'],
    duration: 25
  });

  const userDocRef = useMemoFirebase(() => 
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);
  
  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);
  
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesCollection);
  
  const isLoading = isLoadingActivities || isLoadingProfile;
  
  const allActivities = useMemo(() => {
    if (isLoadingActivities) return [];
    if (!activities || activities.length === 0) {
        return generateMockActivities(365);
    }
    return activities;
  }, [activities, isLoadingActivities]);

  const [bestStreak, setBestStreak] = useLocalStorage<number>('best-streak', 0);

  const currentStreak = useMemo(() => {
    if (!allActivities || allActivities.length === 0) {
      return 0;
    }

    const uniqueDates = [...new Set(allActivities.map(a => a.date))]
      .map(d => startOfDay(parseISO(d)))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = startOfDay(new Date());
      const firstDate = uniqueDates[0];
      
      if (differenceInDays(today, firstDate) <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          if (differenceInDays(uniqueDates[i-1], uniqueDates[i]) === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    if (streak > bestStreak) {
        setBestStreak(streak);
    }
    return streak;
  }, [allActivities, bestStreak, setBestStreak]);

  const handleStartTimer = (config: typeof timerConfig) => {
    setTimerConfig(config);
    setIsTiming(true);
  };

  const handleSessionEnd = () => {
    setIsTiming(false);
  };

  if (isTiming) {
    return (
      <ActivityTimer
        mode={timerConfig.mode}
        initialActivityName={timerConfig.activityName}
        initialActivityType={timerConfig.activityType}
        initialDuration={timerConfig.duration}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  if (isLoading) {
      return (
          <div className="flex items-center justify-center text-center py-16">
                <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
      )
  }

  if (allActivities.length === 0 && !isTiming) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome to Your StudyTrack Journal
        </h2>
        <p className="text-muted-foreground max-w-md">
          Start by logging your study activities to see your progress beautifully visualized here.
        </p>
         <Button asChild className="mt-4">
            <Link href="/activities">Log an Activity</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveSessionCard onStartTimer={handleStartTimer} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
            <GamificationCard activities={allActivities} />
        </div>
        <div className="lg:col-span-1">
            <StreakCard currentStreak={currentStreak} bestStreak={bestStreak} />
        </div>
        <div className="lg:col-span-2">
            <TodaysFocusCard activities={allActivities} />
        </div>
        <div className="lg:col-span-2">
            <StatsCards activities={allActivities} targetHours={userProfile?.targetHours} type="focus" />
        </div>
      </div>
      <div>
        <ActivityHistory activities={allActivities} />
      </div>
    </div>
  );
}
