
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock } from 'lucide-react';
import { parseISO, isToday } from 'date-fns';

interface TodaysFocusCardProps {
  activities: Activity[];
}

const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins}m`;
};

export function TodaysFocusCard({ activities }: TodaysFocusCardProps) {
  const { sessions, duration } = useMemo(() => {
    const today = new Date();
    const todaysActivities = activities.filter(a => {
        const activityDate = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : parseISO(a.date);
        return isToday(activityDate);
    });

    const totalDuration = todaysActivities.reduce((sum, a) => sum + a.duration, 0);

    return {
      sessions: todaysActivities.length,
      duration: totalDuration,
    };
  }, [activities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          TODAY'S FOCUS
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">SESSIONS</p>
          <p className="text-2xl font-bold text-primary">{sessions}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">DURATION</p>
          <p className="text-2xl font-bold text-accent">{formatHours(duration)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
