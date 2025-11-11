
"use client";

import type { Activity, Problem } from "@/lib/types";
import { useMemo } from "react";
import { format, subDays, parseISO, startOfDay } from "date-fns";
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          <GamificationCard activities={allActivities} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StreakCard activities={allActivities} />
          </div>
          <StatsCards activities={allActivities} targetHours={userProfile?.targetHours} type="focus" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TodaysFocusCard activities={allActivities} />
          <StatsCards activities={allActivities} targetHours={userProfile?.targetHours} type="progress" />
        </div>
      </div>
      <div>
        <ActivityHistory activities={allActivities} />
      </div>
    </div>
  );
}
