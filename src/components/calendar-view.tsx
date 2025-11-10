
"use client";

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Activity } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { DayView } from './day-view';

export function CalendarView() {
  const { firestore, user } = useFirebase();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const firstDayCurrentMonth = startOfMonth(currentMonth);
  const lastDayCurrentMonth = endOfMonth(currentMonth);

  const activitiesCollection = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'activities') : null
  , [firestore, user]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!activitiesCollection) return null;
    return query(
      activitiesCollection,
      where('createdAt', '>=', Timestamp.fromDate(startOfWeek(firstDayCurrentMonth))),
      where('createdAt', '<=', Timestamp.fromDate(endOfWeek(lastDayCurrentMonth)))
    );
  }, [activitiesCollection, firstDayCurrentMonth, lastDayCurrentMonth]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(lastDayCurrentMonth),
  });

  const groupActivitiesByDay = useMemo(() => {
    const grouped: { [key: string]: Activity[] } = {};
    if (activities) {
      activities.forEach((activity) => {
        const dayStr = activity.date;
        if (!grouped[dayStr]) {
          grouped[dayStr] = [];
        }
        grouped[dayStr].push(activity);
      });
    }
    return grouped;
  }, [activities]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <>
      <div className="p-4 bg-card rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px border-t border-l border-border">
          {days.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayActivities = groupActivitiesByDay[dayKey] || [];
            return (
              <div
                key={day.toString()}
                className={cn(
                  'relative flex flex-col bg-card p-2 min-h-[120px] overflow-hidden cursor-pointer hover:bg-muted/50 border-b border-r border-border',
                  !isSameMonth(day, currentMonth) && 'bg-muted/50 text-muted-foreground'
                )}
                onClick={() => handleDayClick(day)}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'font-medium',
                    isToday(day) &&
                      'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </time>
                <div className="mt-1 flex-1 overflow-y-auto">
                  {isLoading && (
                    <div className="w-full h-4 bg-muted rounded animate-pulse mt-1"></div>
                  )}
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="mt-1 p-1 text-xs rounded-md bg-primary/10 text-primary-foreground/90 truncate"
                      title={`${activity.name} (${activity.duration} min)`}
                    >
                      <span className="font-bold text-primary">{activity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(isOpen) => !isOpen && setSelectedDate(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'eeee, MMMM d') : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedDate && (
             <DayView 
                date={selectedDate} 
                activities={groupActivitiesByDay[format(selectedDate, 'yyyy-MM-dd')] || []} 
              />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
