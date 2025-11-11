
"use client";

import type { Activity, Problem } from "@/lib/types";
import { useMemo, useState } from "react";
import { format, subDays, parseISO, startOfDay, eachDayOfInterval, getWeek, getDay, isSameDay } from "date-fns";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart3, Clock, Target, TrendingUp, Goal, CheckCircle, ChevronDown, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { GamificationCard } from "./gamification-card";
import { StatsCards } from "./stats-cards";
import { ActivityHistory } from "./activity-history";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";

type UserProfile = {
  name?: string;
  learningGoals?: string;
  targetHours?: number;
}

function TodaysMotivation({ goals }: { goals?: string }) {
    // In a real app, this could be fetched from a service or be user-editable.
    const motivation = goals || "Focus on the process, not just the outcome";
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    DAILY MOTIVATION
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm italic">"{motivation}"</p>
            </CardContent>
        </Card>
    )
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
  
  const problemsCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "problems") : null
  , [firestore, user]);

  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesCollection);
  const { data: problems, isLoading: isLoadingProblems } = useCollection<Problem>(problemsCollection);
  
  const isLoading = isLoadingActivities || isLoadingProblems || isLoadingProfile;
  
  const studyActivities = useMemo(() => {
    if (!activities) return [];
    return activities.filter(a => a.type === 'Study' || a.type === 'Class');
  }, [activities]);


  if (isLoading) {
      return (
          <div className="flex items-center justify-center text-center py-16">
                <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
      )
  }

  if (!activities || activities.length === 0) {
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
    <Dialog>
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
              <GamificationCard activities={studyActivities} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                      <TodaysMotivation goals={userProfile?.learningGoals} />
                  </div>
                  <div className="md:col-span-2">
                      <StatsCards activities={studyActivities} targetHours={userProfile?.targetHours} />
                  </div>
              </div>
          </div>
          <div className="lg:col-span-1">
              {/* Placeholder for future cards like 'Today's Focus' */}
          </div>
        </div>
      </div>
       <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Activity Heat Map</DialogTitle>
            <DialogDescription>
              Your study activity over the past year. Darker shades mean more study time.
            </DialogDescription>
          </DialogHeader>
          <ActivityHistory activities={studyActivities} />
      </DialogContent>
    </Dialog>
  );
}
