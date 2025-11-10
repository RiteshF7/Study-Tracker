"use client";

import { useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, addMinutes, parse } from 'date-fns';

const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

const activityColors = [
    'bg-blue-200 border-blue-400 text-blue-800',
    'bg-green-200 border-green-400 text-green-800',
    'bg-yellow-200 border-yellow-400 text-yellow-800',
    'bg-purple-200 border-purple-400 text-purple-800',
    'bg-pink-200 border-pink-400 text-pink-800',
    'bg-indigo-200 border-indigo-400 text-indigo-800',
];

const getActivityColor = (index: number) => {
    return activityColors[index % activityColors.length];
}

interface DayViewProps {
  date: Date;
  activities: Activity[];
}

export function DayView({ date, activities }: DayViewProps) {

  const sortedActivities = useMemo(() => {
    if (!activities) return [];
    return [...activities].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  }, [activities]);

  const getPositionAndHeight = (activity: Activity) => {
    const [startHour, startMinute] = activity.startTime.split(':').map(Number);
    const top = (startHour - 6) * 60 + startMinute; // 6 AM is the start
    const height = activity.duration;
    return { top, height };
  };

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="grid grid-cols-[auto_1fr] h-full">
        {/* Time column */}
        <div className="text-right text-xs text-muted-foreground pr-2">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] relative -top-2">
              {format(new Date(0, 0, 0, hour), 'h a')}
            </div>
          ))}
        </div>
        
        {/* Schedule grid */}
        <div className="relative border-l border-border">
          {/* Hour lines */}
          {hours.map((hour, index) => (
            <div key={hour} className={cn("h-[60px]", index < hours.length -1 && 'border-b border-border')}></div>
          ))}

          {/* Activity blocks */}
          {sortedActivities.map((activity, index) => {
            const { top, height } = getPositionAndHeight(activity);
            const end = addMinutes(parse(activity.startTime, 'HH:mm', new Date()), activity.duration);

            return (
              <div
                key={activity.id}
                className={cn(
                  'absolute left-2 right-2 p-2 rounded-lg border text-sm overflow-hidden',
                  getActivityColor(index)
                )}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                }}
              >
                <p className="font-bold truncate">{activity.name}</p>
                <p className="text-xs">{activity.startTime} - {format(end, 'HH:mm')}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
