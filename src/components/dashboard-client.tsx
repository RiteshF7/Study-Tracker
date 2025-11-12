
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
import { ActivityHistory } from "./activity-history";
import { generateMockActivities } from "@/lib/mock-data";
import { TodaysFocusCard } from "./todays-focus-card";
import { StreakCard } from "./streak-card";
import { useLocalStorage } from "@/hooks/use-local-storage";

type UserProfile = {
  name?: string;
  learningGoals?: string;
  targetHours?: number;
}

export function DashboardClient() {
  const { firestore, user } = useFirebase();

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


  if (isLoading) {
      return (
          <div className="flex items-center justify-center text-center py-16">
                <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
      )
  }

  if (allActivities.length === 0) {
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 lg:row-span-2 h-full">
            <GamificationCard activities={allActivities} />
        </div>
        <div className="lg:col-span-1">
            <StreakCard currentStreak={currentStreak} bestStreak={bestStreak} />
        </div>
        <div className="lg:col-span-1">
            <TodaysFocusCard activities={allActivities} />
        </div>
      </div>
      <div>
        <ActivityHistory activities={allActivities} />
      </div>
    </div>
  );
}
