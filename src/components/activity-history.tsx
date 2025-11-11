
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { subDays, format, startOfWeek, addDays } from 'date-fns';

const getIntensity = (minutes: number) => {
    if (minutes === 0) return 0;
    if (minutes <= 60) return 1;
    if (minutes <= 120) return 2;
    if (minutes <= 240) return 3;
    return 4;
};

const intensityClasses = [
    'bg-muted/20', // Intensity 0
    'bg-primary/20', // Intensity 1
    'bg-primary/40', // Intensity 2
    'bg-primary/70', // Intensity 3
    'bg-primary/100', // Intensity 4
];

const DaySquare = ({ date, minutes }: { date: Date, minutes: number }) => {
    const intensity = getIntensity(minutes);

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-3 w-3 rounded-sm",
                        intensityClasses[intensity]
                    )}/>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs text-muted-foreground">
                        {format(date, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-bold">
                        {minutes > 0 ? `${minutes} minutes` : 'No activity'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


export function ActivityHistory({ activities }: { activities: Activity[] }) {
    const activityByDate = useMemo(() => {
        const map = new Map<string, number>();
        activities.forEach(a => {
            if (a.createdAt && a.createdAt.toDate) {
                const dateKey = format(a.createdAt.toDate(), 'yyyy-MM-dd');
                map.set(dateKey, (map.get(dateKey) || 0) + a.duration);
            }
        });
        return map;
    }, [activities]);

    const squares = useMemo(() => {
        const today = new Date();
        const yearAgo = subDays(today, 365);
        const firstDay = startOfWeek(yearAgo);

        const days = [];
        let day = firstDay;
        while (day <= today) {
            days.push(day);
            day = addDays(day, 1);
        }
        
        return days.map(d => {
            const dateKey = format(d, 'yyyy-MM-dd');
            return {
                date: d,
                minutes: activityByDate.get(dateKey) || 0
            };
        });
    }, [activityByDate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    ACTIVITY HISTORY
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1">
                    {squares.map(({ date, minutes }) => (
                         <DaySquare key={date.toString()} date={date} minutes={minutes} />
                    ))}
                </div>
                 <div className="flex justify-end items-center gap-2 mt-4 text-xs text-muted-foreground">
                    Less
                    <div className="flex gap-1">
                        {intensityClasses.map((className, i) => (
                            <div key={i} className={cn("h-3 w-3 rounded-sm", className)} />
                        ))}
                    </div>
                    More
                </div>
            </CardContent>
        </Card>
    );
}
