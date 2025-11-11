
"use client";

import { Card, CardContent } from './ui/card';
import { Flame, Trophy } from 'lucide-react';

interface StreakCardProps {
  type: 'current' | 'best';
  value: number;
}

export function StreakCard({ type, value }: StreakCardProps) {
  const isCurrent = type === 'current';
  const title = isCurrent ? 'DAY STREAK' : 'BEST STREAK';
  const color = isCurrent ? 'text-orange-400' : 'text-yellow-400';
  const Icon = isCurrent ? Flame : Trophy;

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="text-center">
          <p className={`text-4xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <Icon className={`w-10 h-10 ${color}`} />
      </CardContent>
    </Card>
  );
}
