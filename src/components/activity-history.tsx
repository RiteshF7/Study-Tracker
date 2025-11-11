
"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { subDays, format, startOfWeek, addDays, getDay, startOfYear, getMonth, endOfYear, parseISO } from 'date-fns';

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
            if (a.createdAt) {
                const date = (a.createdAt as any).toDate ? (a.createdAt as any).toDate() : parseISO(a.date);
                const dateKey = format(date, 'yyyy-MM-dd');
                map.set(dateKey, (map.get(dateKey) || 0) + a.duration);
            }
        });
        return map;
    }, [activities]);

    const { squares, monthLabels } = useMemo(() => {
        const today = new Date();
        const firstDayOfYear = startOfYear(today);
        const firstDayToRender = startOfWeek(firstDayOfYear);
        const lastDayOfYear = endOfYear(today);

        const days = [];
        let day = firstDayToRender;
        while (day <= lastDayOfYear) {
            days.push(day);
            day = addDays(day, 1);
        }
        
        const squaresData = days.map(d => {
            const dateKey = format(d, 'yyyy-MM-dd');
            return {
                date: d,
                minutes: activityByDate.get(dateKey) || 0
            };
        });

        const monthLabelsData = [];
        let lastMonth = -1;
        for (let i = 0; i < squaresData.length; i += 7) {
            const week = squaresData.slice(i, i + 7);
            const firstDayOfWeek = week[0]?.date;
            if(firstDayOfWeek) {
                const currentMonth = getMonth(firstDayOfWeek);
                if (currentMonth !== lastMonth) {
                    monthLabelsData.push({ label: format(firstDayOfWeek, 'MMM'), weekIndex: Math.floor(i / 7) });
                    lastMonth = currentMonth;
                }
            }
        }

        return { squares: squaresData, monthLabels: monthLabelsData };
    }, [activityByDate]);
    
    const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    ACTIVITY HISTORY
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-[3px] pt-5">
                            {weekdayLabels.map((label, i) => (
                            <div key={i} className="text-xs text-muted-foreground" style={{ height: '12px', lineHeight: '12px' }}>
                                    {i % 2 !== 0 ? label : ''}
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, auto)' }}>
                                {squares.map(({ date, minutes }, index) => (
                                    <DaySquare key={index} date={date} minutes={minutes} />
                                ))}
                            </div>
                            <div className="absolute top-0 -mt-5 flex">
                                {monthLabels.map(({ label, weekIndex }) => (
                                    <div key={`${label}-${weekIndex}`} className="text-xs text-muted-foreground" style={{ position: 'absolute', left: `${weekIndex * 16}px` }}>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
