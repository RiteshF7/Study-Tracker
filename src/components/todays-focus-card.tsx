
"use client";

import { useMemo, useState }from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Clock } from 'lucide-react';
import { parseISO, isToday, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FocusChart } from './focus-chart';

interface TodaysFocusCardProps {
  activities: Activity[];
}

const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

export function TodaysFocusCard({ activities }: TodaysFocusCardProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  
  const { todaySessions, todayDuration, total7, total30 } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    let todayDuration = 0;
    let todaySessions = 0;
    let duration7 = 0;
    let duration30 = 0;

    activities.forEach(a => {
        const activityDate = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : parseISO(a.date);
        
        if (isToday(activityDate)) {
            todaySessions++;
            todayDuration += a.duration;
        }

        if (activityDate >= sevenDaysAgo) {
            duration7 += a.duration;
        }
        if (activityDate >= thirtyDaysAgo) {
            duration30 += a.duration;
        }
    });

    return {
      todaySessions,
      todayDuration,
      total7: duration7,
      total30: duration30,
    };
  }, [activities]);

  return (
    <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              FOCUS SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">TODAY'S SESSIONS</p>
              <p className="text-2xl font-bold text-primary">{todaySessions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">TODAY'S DURATION</p>
              <p className="text-2xl font-bold text-accent">{formatHours(todayDuration)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
             <div className="w-full flex justify-between text-sm">
                <span className="text-muted-foreground">Last 7 Days</span>
                <span className="font-semibold">{formatHours(total7)}</span>
             </div>
             <div className="w-full flex justify-between text-sm">
                <span className="text-muted-foreground">Last 30 Days</span>
                <span className="font-semibold">{formatHours(total30)}</span>
             </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>Focus Analysis</DialogTitle>
        </DialogHeader>
        <div className="h-full py-4">
          <FocusChart activities={activities} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
