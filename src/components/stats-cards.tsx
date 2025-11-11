
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Flame, Trophy, TrendingUp, Target } from 'lucide-react';
import { parseISO, differenceInDays, startOfDay, subDays } from 'date-fns';
import { Progress } from './ui/progress';

interface StatsCardsProps {
  activities: Activity[];
  targetHours?: number;
}

const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
}

export function StatsCards({ activities, targetHours = 150 }: StatsCardsProps) {
  const [bestStreak, setBestStreak] = useLocalStorage<number>('best-streak', 0);

  const { currentStreak, totalMinutes, totalSessions, avg7, avg30, totalAvg } = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { currentStreak: 0, totalMinutes: 0, totalSessions: 0, avg7: 0, avg30: 0, totalAvg: 0 };
    }

    const uniqueDates = [...new Set(activities.map(a => a.date))]
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
    
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);
    
    let minutes7 = 0, sessions7 = 0;
    let minutes30 = 0, sessions30 = 0;
    let totalMinutes = 0, totalSessions = 0;

    const uniqueDays7 = new Set();
    const uniqueDays30 = new Set();
    const uniqueDaysTotal = new Set();
    
    activities.forEach(a => {
        const activityDate = parseISO(a.date);
        totalMinutes += a.duration;
        totalSessions++;
        uniqueDaysTotal.add(a.date);

        if (activityDate >= sevenDaysAgo) {
            minutes7 += a.duration;
            sessions7++;
            uniqueDays7.add(a.date);
        }
        if (activityDate >= thirtyDaysAgo) {
            minutes30 += a.duration;
            sessions30++;
            uniqueDays30.add(a.date);
        }
    });

    return {
        currentStreak: streak,
        totalMinutes,
        totalSessions,
        avg7: uniqueDays7.size > 0 ? minutes7 / uniqueDays7.size : 0,
        avg30: uniqueDays30.size > 0 ? minutes30 / uniqueDays30.size : 0,
        totalAvg: uniqueDaysTotal.size > 0 ? totalMinutes / uniqueDaysTotal.size : 0,
    };

  }, [activities, bestStreak, setBestStreak]);

  const totalHours = totalMinutes / 60;
  const progressPercentage = (totalHours / targetHours) * 100;


  return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    FOCUS INSIGHTS
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">7 DAYS AVG</p>
                    <p className="text-lg font-bold">{formatHours(avg7)}</p>
                </div>
                 <div className="text-center">
                    <p className="text-xs text-muted-foreground">30 DAYS AVG</p>
                    <p className="text-lg font-bold">{formatHours(avg30)}</p>
                </div>
                 <div className="text-center">
                    <p className="text-xs text-muted-foreground">TOTAL AVG</p>
                    <p className="text-lg font-bold">{formatHours(totalAvg)}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Flame className="w-5 h-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">DAY STREAK</p>
            </CardContent>
        </Card>
        <Card>
             <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{bestStreak}</p>
                <p className="text-xs text-muted-foreground">BEST STREAK</p>
            </CardContent>
        </Card>

         <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4"/>
                    TOTAL PROGRESS
                </CardTitle>
                <div className="text-sm font-bold text-primary">{progressPercentage.toFixed(1)}%</div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground">SESSIONS</p>
                        <p className="font-bold text-lg">{totalSessions}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">HOURS</p>
                        <p className="font-bold text-lg">{formatHours(totalMinutes)}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-muted-foreground">PROGRESS</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <Target className="w-3 h-3" /> {targetHours}hr
                        </p>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>
            </CardContent>
        </Card>
      </div>
  );
}
