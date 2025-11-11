
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { TrendingUp, Target, Pencil } from 'lucide-react';
import { parseISO, subDays } from 'date-fns';
import { Progress } from './ui/progress';

interface StatsCardsProps {
  activities: Activity[];
  targetHours?: number;
  type: 'focus' | 'progress';
}

const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

export function StatsCards({ activities, targetHours = 100, type }: StatsCardsProps) {

  const { totalMinutes, totalSessions, avg7, avg30 } = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { totalMinutes: 0, totalSessions: 0, avg7: 0, avg30: 0 };
    }

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);
    
    let minutes7 = 0;
    let minutes30 = 0;
    let totalMinutes = 0;
    
    const uniqueDays7 = new Set();
    const uniqueDays30 = new Set();
    
    activities.forEach(a => {
        const activityDate = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : parseISO(a.date);
        totalMinutes += a.duration;

        if (activityDate >= sevenDaysAgo) {
            minutes7 += a.duration;
            uniqueDays7.add(activityDate.toDateString());
        }
        if (activityDate >= thirtyDaysAgo) {
            minutes30 += a.duration;
            uniqueDays30.add(activityDate.toDateString());
        }
    });

    return {
        totalMinutes,
        totalSessions: activities.length,
        avg7: uniqueDays7.size > 0 ? minutes7 / uniqueDays7.size : 0,
        avg30: uniqueDays30.size > 0 ? minutes30 / uniqueDays30.size : 0,
    };

  }, [activities]);

  const totalHours = totalMinutes / 60;
  const progressPercentage = (totalHours / targetHours) * 100;

  if (type === 'focus') {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    FOCUS INSIGHTS
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">LAST 7 DAYS</p>
                    <p className="text-2xl font-bold text-primary">{formatHours(avg7 * 7)}</p>
                </div>
                 <div className="text-center">
                    <p className="text-xs text-muted-foreground">LAST 30 DAYS</p>
                    <p className="text-2xl font-bold text-accent">{formatHours(avg30 * 30)}</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (type === 'progress') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            TOTAL PROGRESS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <p className="text-xs text-muted-foreground">SESSIONS</p>
                  <p className="text-2xl font-bold text-primary">{totalSessions}</p>
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">HOURS</p>
                  <p className="text-2xl font-bold text-accent">{totalHours.toFixed(2)}</p>
              </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    TARGET HOURS
                </p>
                <p className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:text-primary">
                    {targetHours}hr <Pencil className="w-3 h-3" />
                </p>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-primary/20" />
            <p className='text-right text-xs mt-1 text-muted-foreground'>
                {progressPercentage.toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
