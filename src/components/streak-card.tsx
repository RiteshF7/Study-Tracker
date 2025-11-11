
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Flame, Trophy, Award } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';

interface StreakCardProps {
  activities: Activity[];
}

export function StreakCard({ activities }: StreakCardProps) {
  const [bestStreak, setBestStreak] = useLocalStorage<number>('best-streak', 0);

  const currentStreak = useMemo(() => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    const uniqueDates = [...new Set(activities.map(a => a.date))]
      .map(d => startOfDay(parseISO(d)))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = startOfDay(new Date());
      const firstDate = uniqueDates[0];
      
      // Check if the most recent activity was today or yesterday
      if (differenceInDays(today, firstDate) <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          if (differenceInDays(uniqueDates[i-1], uniqueDates[i]) === 1) {
            streak++;
          } else {
            break; // Streak is broken
          }
        }
      }
    }
    
    if (streak > bestStreak) {
        setBestStreak(streak);
    }
    return streak;
  }, [activities, bestStreak, setBestStreak]);

  return (
    <>
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="text-center">
                    <p className="text-4xl font-bold text-orange-400">{currentStreak}</p>
                    <p className="text-xs text-muted-foreground">DAY STREAK</p>
                </div>
                <Flame className="w-10 h-10 text-orange-400" />
            </CardContent>
        </Card>
        <Card>
             <CardContent className="p-4 flex items-center justify-between">
                <div className='text-center'>
                    <p className="text-4xl font-bold text-yellow-400">{bestStreak}</p>
                    <p className="text-xs text-muted-foreground">BEST STREAK</p>
                </div>
                 <div className="flex flex-col items-center">
                    <Trophy className="w-10 h-10 text-yellow-400" />
                    {bestStreak > 100 && <span className="text-xs font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full mt-1">Master</span>}
                </div>
            </CardContent>
        </Card>
    </>
  );
}
