'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { ActivityTimer } from '@/components/activity-timer';
import { LiveSessionCard } from '@/components/live-session-card';
import { BentoGrid, BentoGridItem } from '@/components/dashboard/BentoGrid';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { useFirebase } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, setDoc } from 'firebase/firestore';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subDays, differenceInDays } from 'date-fns';
import { Flame, Clock, Target, Trophy } from 'lucide-react';
import { calculateLevel, getNextLevel, Badge } from '@/lib/gamification';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTiming, setIsTiming] = useState(false);
  const [timerConfig, setTimerConfig] = useState<{
    mode: 'timer' | 'stopwatch';
    activityName: string;
    activityType: Activity['type'];
    category?: string;
    duration: number;
  }>({
    mode: 'timer',
    activityName: '',
    activityType: 'Study',
    category: '',
    duration: 25,
  });

  const [userProfile, setUserProfile] = useState<{ xp: number; level: number; badges: Badge[]; dailyGoal?: number } | null>(null);

  // Fetch Activities
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, "users", user.uid, "activities"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(fetchedActivities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  // Fetch User Profile
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(firestore, "users", user.uid, "profile", "stats");
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as any);
      } else {
        setUserProfile({ xp: 0, level: 1, badges: [] });
      }
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Calculate Stats
  const stats = useMemo(() => {
    if (!activities.length) return { totalMinutes: 0, streak: 0, weeklyData: [] };

    // Total Time
    const totalMinutes = activities.reduce((acc, curr) => acc + curr.duration, 0);

    // Streak
    const sortedDates = [...new Set(activities.map(a => a.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = today;

    // Check if studied today
    if (sortedDates.includes(today)) {
      streak = 1;
      currentDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // Yesterday
    }

    for (const date of sortedDates) {
      if (date === today && streak === 1) continue; // Already counted today

      if (date === currentDate) {
        streak++;
        currentDate = new Date(new Date(currentDate).getTime() - 86400000).toISOString().split('T')[0];
      } else if (date < currentDate) {
        break; // Streak broken
      }
    }

    // Weekly Data
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const weeklyData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayActivities = activities.filter(a => a.date === dateStr);
      const minutes = dayActivities.reduce((acc, curr) => acc + curr.duration, 0);
      return {
        name: format(day, 'EEE'),
        minutes
      };
    });

    return { totalMinutes, streak, weeklyData };
  }, [activities]);

  const levelInfo = useMemo(() => {
    if (!userProfile) return { current: { level: 1, title: 'Novice' }, next: { minXp: 500 }, progress: 0 };
    const current = calculateLevel(userProfile.xp);
    const next = getNextLevel(current.level);

    let progress = 0;
    if (next) {
      const prevLevelXp = current.minXp;
      const levelRange = next.minXp - prevLevelXp;
      const currentProgress = userProfile.xp - prevLevelXp;
      progress = (currentProgress / levelRange) * 100;
    } else {
      progress = 100; // Max level
    }

    return { current, next, progress };
  }, [userProfile]);

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
        initialCategory={timerConfig.category}
        initialDuration={timerConfig.duration}
        tags={timerConfig.tags}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(60);

  // Calculate Daily Progress
  const dailyProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter(a => a.date === today);
    return todayActivities.reduce((acc, curr) => acc + curr.duration, 0);
  }, [activities]);

  const dailyGoal = userProfile?.dailyGoal || 60;
  const dailyGoalProgress = Math.min((dailyProgress / dailyGoal) * 100, 100);

  const handleSaveGoal = async () => {
    if (!user) return;
    const profileRef = doc(firestore, "users", user.uid, "profile", "stats");
    await setDoc(profileRef, { dailyGoal: newGoal }, { merge: true });
    setIsGoalDialogOpen(false);
    toast({ title: "Goal Updated", description: `Daily goal set to ${newGoal} minutes.` });
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, ready to focus?</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full backdrop-blur-sm border border-border/50">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="font-bold">{stats.streak} Day Streak</span>
        </div>
      </div>

      <BentoGrid>
        {/* Main Action Card - Live Session */}
        <BentoGridItem colSpan={2} rowSpan={2} className="p-0">
          <LiveSessionCard onStartTimer={handleStartTimer} />
        </BentoGridItem>

        {/* Stats Cards */}
        <BentoGridItem>
          <StatsCard
            title="Total Focus"
            value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
            icon={Clock}
            description="Lifetime study time"
            className="h-full bg-transparent shadow-none"
          />
        </BentoGridItem>

        <BentoGridItem>
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
            <DialogTrigger asChild>
              <div className="cursor-pointer h-full">
                <StatsCard
                  title="Daily Goal"
                  value={`${Math.floor(dailyProgress / 60)}h ${dailyProgress % 60}m / ${Math.floor(dailyGoal / 60)}h ${dailyGoal % 60}m`}
                  icon={Target}
                  description={`${Math.round(dailyGoalProgress)}% of daily goal`}
                  className="h-full bg-transparent shadow-none hover:bg-secondary/10 transition-colors"
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Daily Goal</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="goal" className="mb-2 block">Daily Goal (minutes)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(Number(e.target.value))}
                  min={1}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSaveGoal}>Save Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </BentoGridItem>

        {/* Weekly Chart */}
        <BentoGridItem colSpan={2} className="min-h-[250px]">
          <ActivityChart data={stats.weeklyData} />
        </BentoGridItem>

        {/* Recent Achievements / Motivation */}
        <BentoGridItem>
          <div className="h-full flex flex-col justify-between p-6 bg-background/60 backdrop-blur-xl rounded-xl border border-border/50 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Level & Badges</h3>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>

              <div className="flex items-end gap-2 mb-4">
                <div className="text-2xl font-bold">{levelInfo.current.title}</div>
                <div className="text-sm text-muted-foreground mb-1">Lvl {levelInfo.current.level}</div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.floor(userProfile?.xp || 0)} XP</span>
                  <span>{levelInfo.next ? `${levelInfo.next.minXp} XP` : 'Max'}</span>
                </div>
                <Progress value={levelInfo.progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {levelInfo.next
                    ? `${Math.ceil(levelInfo.next.minXp - (userProfile?.xp || 0))} XP to next level`
                    : "Max Level Reached!"}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile?.badges && userProfile.badges.length > 0 ? (
                    userProfile.badges.map((badge) => (
                      <div key={badge.id} className="group relative">
                        <div className="p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors cursor-help">
                          {/* Simple icon mapping or fallback */}
                          <span className="text-lg" role="img" aria-label={badge.name}>
                            {badge.icon === 'Moon' ? '🌙' :
                              badge.icon === 'Sun' ? '☀️' :
                                badge.icon === 'Timer' ? '⏱️' :
                                  badge.icon === 'Calendar' ? '📅' :
                                    badge.icon === 'Footprints' ? '👣' : '🏅'}
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border">
                          {badge.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No badges yet. Start studying!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
}
