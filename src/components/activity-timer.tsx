
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/lib/types";
import { activityTypes, courses, defaultSubjects, CourseName, YearName } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square } from "lucide-react";
import { useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

type UserProfile = {
  course?: CourseName;
  year?: string;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
};

type TimerState = {
  subject: string;
  type: Activity['type'];
  isTiming: boolean;
  elapsedTime: number;
  startTime: number | null;
};

const CIRCLE_RADIUS = 105;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function ActivityTimer() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(() =>
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const problemSubjects = useMemo(() => {
    const courseName = userProfile?.course;
    const yearName = userProfile?.year;
    
    if (courseName && courses[courseName]) {
      const courseData = courses[courseName];
      if (yearName && courseData[yearName as keyof typeof courseData]) {
        return courseData[yearName as keyof typeof courseData];
      }
      return Object.values(courseData).flat();
    }
    
    return defaultSubjects;
  }, [userProfile]);

  const [timerState, setTimerState] = useLocalStorage<TimerState>('activity-timer-state', {
    subject: '',
    type: 'Study',
    isTiming: false,
    elapsedTime: 0,
    startTime: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState.isTiming && timerState.startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerState.startTime!) / 1000);
        setTimerState(prev => ({...prev, elapsedTime: elapsed }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.isTiming, timerState.startTime, setTimerState]);
  
  useEffect(() => {
    if (problemSubjects.length > 0 && !timerState.subject) {
      setTimerState(prev => ({...prev, subject: problemSubjects[0]}));
    }
  }, [problemSubjects, timerState.subject, setTimerState]);


  const handleStart = () => {
    if (!timerState.subject) {
      toast({
        variant: "destructive",
        title: "No Subject Selected",
        description: "Please select a subject before starting the timer.",
      });
      return;
    }
    setTimerState({
      ...timerState,
      isTiming: true,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!activitiesCollection || !user) return;
    
    const durationInMinutes = Math.max(1, Math.round(timerState.elapsedTime / 60));

    const newActivity: Omit<Activity, 'id' | 'createdAt'> & { createdAt: any } = {
      name: timerState.subject,
      type: timerState.type,
      duration: durationInMinutes,
      date: new Date().toISOString().split("T")[0],
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(activitiesCollection, newActivity);
    
    toast({
        title: "Activity Logged!",
        description: `${timerState.subject} for ${durationInMinutes} ${durationInMinutes > 1 ? 'minutes' : 'minute'} has been saved.`,
    });

    setTimerState({
      subject: problemSubjects[0] || '',
      type: 'Study',
      isTiming: false,
      elapsedTime: 0,
      startTime: null,
    });
    router.push('/activities');
  };
  
  const totalSecondsForLoop = 30 * 60; // 30 minutes in seconds
  const progressInLoop = timerState.elapsedTime % totalSecondsForLoop;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (progressInLoop / totalSecondsForLoop) * CIRCLE_CIRCUMFERENCE;

  return (
    <div className="h-screen w-screen bg-background relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md text-center p-4">
        {timerState.isTiming ? (
          <div className="space-y-8 flex flex-col items-center">
            <p className="text-2xl text-muted-foreground">Timing session for:</p>
            <h1 className="text-6xl font-bold font-headline">{timerState.subject}</h1>
            
            <div className="relative w-[224px] h-[224px]">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 224 224">
                    <defs>
                        <linearGradient id="progressGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{stopColor: '#4ade80', stopOpacity: 0.8}} />
                            <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
                        </linearGradient>
                    </defs>
                    <circle
                        className="text-border"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        r={CIRCLE_RADIUS}
                        cx="112"
                        cy="112"
                    />
                    <circle
                        stroke="url(#progressGradientGreen)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        r={CIRCLE_RADIUS}
                        cx="112"
                        cy="112"
                        style={{
                            strokeDasharray: CIRCLE_CIRCUMFERENCE,
                            strokeDashoffset: strokeDashoffset,
                            transition: 'stroke-dashoffset 1s linear',
                        }}
                    />
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-mono text-5xl font-bold tabular-nums tracking-tighter">
                        {formatTime(timerState.elapsedTime)}
                    </p>
                </div>
            </div>

             <Button size="lg" variant="default" onClick={handleStop} className="w-full py-8 text-2xl">
                <Square className="mr-4 h-8 w-8" /> Stop & Save
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold font-headline">Start a New Session</h1>
            <p className="text-muted-foreground">Select a subject and type to begin tracking your time.</p>
            <div className="grid grid-cols-2 gap-4 text-left">
                <div className="grid gap-2">
                    <Label htmlFor="subject-select" className="text-lg">Subject</Label>
                    <Select onValueChange={(val) => setTimerState(prev => ({...prev, subject: val}))} value={timerState.subject} defaultValue={timerState.subject}>
                        <SelectTrigger id="subject-select" className="py-6 text-lg">
                            <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {problemSubjects.map((s) => (
                            <SelectItem key={s} value={s} className="text-lg">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="type-select" className="text-lg">Type</Label>
                    <Select onValueChange={(v) => setTimerState(prev => ({...prev, type: v as Activity['type']}))} defaultValue={timerState.type}>
                        <SelectTrigger id="type-select" className="py-6 text-lg">
                            <SelectValue placeholder="Select an activity type" />
                        </Trigger>
                        <SelectContent>
                            {activityTypes.map((t) => (
                            <SelectItem key={t} value={t} className="text-lg">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button size="lg" onClick={handleStart} className="w-full py-8 text-2xl">
                <Play className="mr-4 h-8 w-8" /> Start Timer
            </Button>
             <Button variant="ghost" onClick={() => router.push('/activities')}>
                Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
