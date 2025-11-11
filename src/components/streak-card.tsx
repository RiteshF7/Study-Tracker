
"use client";

import { Card, CardContent } from './ui/card';
import { Flame, Trophy } from 'lucide-react';
import { Separator } from './ui/separator';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-2 divide-x divide-border">
        <div className="flex items-center justify-between p-2">
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-400">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">DAY STREAK</p>
          </div>
          <Flame className="w-10 h-10 text-orange-400" />
        </div>
        <div className="flex items-center justify-between p-2">
          <div className="text-center">
            <p className="text-4xl font-bold text-yellow-400">{bestStreak}</p>
            <p className="text-xs text-muted-foreground">BEST STREAK</p>
          </div>
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>
      </CardContent>
    </Card>
  );
}
