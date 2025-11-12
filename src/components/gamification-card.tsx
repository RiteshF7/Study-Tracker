
"use client";

import { useMemo, type FC } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Star, Trophy } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { Crown } from './icons/crown';

interface Level {
  name: string;
  minHours: number;
  icon: FC<any>;
  iconColor: string;
  badgeColor: string;
  gradient: string;
}

const levels: Level[] = [
  { name: 'Bronze', minHours: 0, icon: Trophy, iconColor: 'text-orange-400', badgeColor: 'border-orange-400/50', gradient: '' },
  { name: 'Silver', minHours: 50, icon: Star, iconColor: 'text-gray-400', badgeColor: 'border-gray-400/50', gradient: '' },
  { name: 'Gold', minHours: 150, icon: Trophy, iconColor: 'text-yellow-400', badgeColor: 'border-yellow-400/50', gradient: '' },
  { name: 'Platinum', minHours: 300, icon: Star, iconColor: 'text-cyan-400', badgeColor: 'border-cyan-400/50', gradient: '' },
  { name: 'Diamond', minHours: 500, icon: Star, iconColor: 'text-blue-400', badgeColor: 'border-blue-400/50', gradient: '' },
  { name: 'Emerald', minHours: 750, icon: Star, iconColor: 'text-emerald-400', badgeColor: 'border-emerald-400/50', gradient: '' },
  { name: 'Legendary', minHours: 1000, icon: Crown, iconColor: 'text-purple-400', badgeColor: 'border-purple-400/50', gradient: '' },
  { name: 'Mythic', minHours: 1500, icon: Crown, iconColor: 'text-red-400', badgeColor: 'border-red-400/50', gradient: '' },
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
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4">
           <div className={cn("p-2 rounded-lg bg-card", currentLevel.badgeColor, 'border')}>
            <currentLevel.icon className={`w-8 h-8 ${currentLevel.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold">{currentLevel.name}</h3>
              <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Level {currentLevelIndex + 1}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{totalHours.toFixed(0)} hrs</span>
              {nextLevel && ` | Progress to ${nextLevel.name}: ${hoursToNextLevel.toFixed(0)} hrs left`}
            </p>
            {nextLevel && (
                <div className="mt-2 space-y-1">
                    <div className='flex justify-end'>
                        <span className="text-xs font-semibold text-primary">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2"/>
                </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex-1 flex items-center">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 w-full">
                {levels.map((level, index) => {
                    const isAchieved = index <= currentLevelIndex;
                    return (
                        <div key={level.name} className="flex flex-col items-center gap-1 text-center">
                            <div className={cn(
                                "w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300",
                                isAchieved 
                                  ? 'bg-gradient-to-br from-primary/30 to-accent/30 border-primary/50 shadow-[0_0_15px_hsl(var(--glow)/0.5)]' 
                                  : 'border-dashed border-border bg-muted/30'
                            )}>
                                <level.icon className={cn("w-6 h-6", isAchieved ? level.iconColor : 'text-muted-foreground/50')} />
                            </div>
                            <p className={cn("text-xs font-medium transition-colors", isAchieved ? 'text-foreground' : 'text-muted-foreground')}>
                                {level.name}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
