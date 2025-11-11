
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Star } from 'lucide-react';
import { Progress } from './ui/progress';

interface Level {
  name: string;
  minHours: number;
  iconColor: string;
}

const levels: Level[] = [
  { name: 'Bronze', minHours: 0, iconColor: 'text-orange-400' },
  { name: 'Silver', minHours: 50, iconColor: 'text-gray-400' },
  { name: 'Gold', minHours: 150, iconColor: 'text-yellow-400' },
  { name: 'Platinum', minHours: 300, iconColor: 'text-cyan-400' },
  { name: 'Diamond', minHours: 500, iconColor: 'text-blue-400' },
  { name: 'Emerald', minHours: 750, iconColor: 'text-emerald-400' },
  { name: 'Master', minHours: 1000, iconColor: 'text-purple-400' },
  { name: 'Grandmaster', minHours: 1500, iconColor: 'text-red-400' },
];

interface GamificationCardProps {
  activities: Activity[];
}

export function GamificationCard({ activities }: GamificationCardProps) {
  const totalMinutes = useMemo(() => {
    return activities.reduce((sum, a) => sum + a.duration, 0);
  }, [activities]);

  const totalHours = totalMinutes / 60;

  const currentLevel = useMemo(() => {
    return [...levels].reverse().find(l => totalHours >= l.minHours) || levels[0];
  }, [totalHours]);

  const currentLevelIndex = levels.findIndex(l => l.name === currentLevel.name);
  const nextLevel = levels[currentLevelIndex + 1];

  const { progressPercentage, hoursToNextLevel } = useMemo(() => {
    if (!nextLevel) {
      return { progressPercentage: 100, hoursToNextLevel: 0 };
    }
    const hoursInCurrentLevel = totalHours - currentLevel.minHours;
    const hoursForNextLevel = nextLevel.minHours - currentLevel.minHours;
    const progress = (hoursInCurrentLevel / hoursForNextLevel) * 100;
    const hoursRemaining = nextLevel.minHours - totalHours;
    
    return {
      progressPercentage: Math.min(progress, 100),
      hoursToNextLevel: Math.max(0, hoursRemaining),
    };
  }, [totalHours, currentLevel, nextLevel]);

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Star className={`w-8 h-8 ${currentLevel.iconColor}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold">{currentLevel.name}</h3>
              <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Level {currentLevelIndex + 1}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalHours.toFixed(0)} hrs
              {nextLevel && ` | Progress to ${nextLevel.name}: ${hoursToNextLevel.toFixed(0)} hrs left`}
            </p>
          </div>
        </div>
        {nextLevel && (
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2"/>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
