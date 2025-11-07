
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Play, Square, TimerOff } from "lucide-react";
import { useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Input } from "./ui/input";
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

type TimerMode = 'timer' | 'stopwatch';

type TimerState = {
  subject: string;
  type: Activity['type'];
  isTiming: boolean;
  // Timer mode
  remainingTime: number; 
  duration: number; // in minutes
  // Stopwatch mode
  elapsedTime: number; // in seconds
  startTime: number | null;
  isFinished: boolean;
};

const CIRCLE_RADIUS = 100;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function ActivityTimer({ mode }: { mode: TimerMode }) {
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

  const [timerState, setTimerState] = useLocalStorage<TimerState>(`activity-session-state-${mode}`, {
    subject: '',
    type: 'Study',
    isTiming: false,
    remainingTime: 25 * 60,
    duration: 25,
    elapsedTime: 0,
    startTime: null,
    isFinished: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };
  
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timerState.isTiming) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerState.startTime!) / 1000);
        if (mode === 'timer') {
          const remaining = timerState.duration * 60 - elapsed;
          if (remaining <= 0) {
            setTimerState(prev => ({...prev, remainingTime: 0, isTiming: false, isFinished: true }));
            playSound();
            clearTimer();
          } else {
            setTimerState(prev => ({...prev, remainingTime: remaining }));
          }
        } else { // Stopwatch
          setTimerState(prev => ({...prev, elapsedTime: elapsed }));
        }
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [timerState.isTiming, timerState.startTime, timerState.duration, setTimerState, mode, clearTimer]);
  
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
        description: "Please select a subject before starting.",
      });
      return;
    }
     if (mode === 'timer' && timerState.duration <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Duration",
        description: "Please set a duration greater than 0 for the timer.",
      });
      return;
    }
    setTimerState({
      ...timerState,
      isTiming: true,
      startTime: Date.now(),
      isFinished: false,
      ...(mode === 'timer' ? { remainingTime: timerState.duration * 60 } : { elapsedTime: 0 }),
    });
  };

  const handleStop = (save: boolean) => {
    clearTimer();
    
    if (save && activitiesCollection && user && timerState.startTime) {
        let durationInMinutes = 0;
        if (mode === 'timer') {
            const elapsedSeconds = timerState.duration * 60 - timerState.remainingTime;
            durationInMinutes = Math.round(elapsedSeconds / 60);
        } else { // stopwatch
            durationInMinutes = Math.round(timerState.elapsedTime / 60);
        }

        // Don't log if duration is 0
        if (durationInMinutes > 0) {
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
        } else {
             toast({
                variant: "destructive",
                title: "Activity Not Logged",
                description: "Duration was zero. No activity was saved.",
            });
        }
    }

    setTimerState({
      subject: problemSubjects[0] || '',
      type: 'Study',
      isTiming: false,
      duration: 25,
      remainingTime: 25 * 60,
      elapsedTime: 0,
      startTime: null,
      isFinished: false,
    });
    
    if (save) {
        router.push('/activities');
    }
  };
  
  const displayTime = mode === 'timer' ? timerState.remainingTime : timerState.elapsedTime;
  const totalSecondsInDuration = mode === 'timer' ? timerState.duration * 60 : 0;
  const progress = mode === 'timer' ? (totalSecondsInDuration - timerState.remainingTime) / totalSecondsInDuration : 0;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="w-full max-w-md text-center pt-8">
      {timerState.isTiming || timerState.isFinished ? (
        <div className={cn("space-y-8 flex flex-col items-center", timerState.isFinished && "animate-blink")}>
          <p className="text-2xl text-muted-foreground">{timerState.isFinished ? "Session Finished!" : `Timing session for (${mode}):`}</p>
          <h1 className="text-6xl font-bold font-headline">{timerState.subject}</h1>
          
          <div className="relative w-[220px] h-[220px]">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 220 220">
                  <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#4ade80'}} />
                          <stop offset="100%" style={{stopColor: '#16a34a'}} />
                      </linearGradient>
                  </defs>
                  <circle
                      className="text-border"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      r={CIRCLE_RADIUS}
                      cx="110"
                      cy="110"
                  />
                  <circle
                      stroke={timerState.isFinished ? "hsl(var(--destructive))" : (mode === 'timer' ? "url(#progressGradient)" : "hsl(var(--primary))")}
                      strokeWidth="12"
                      strokeLinecap="round"
                      fill="transparent"
                      r={CIRCLE_RADIUS}
                      cx="110"
                      cy="110"
                      style={{
                          strokeDasharray: CIRCLE_CIRCUMFERENCE,
                          strokeDashoffset: mode === 'timer' ? strokeDashoffset : undefined,
                          transition: mode === 'timer' ? 'stroke-dashoffset 1s linear' : 'none',
                      }}
                  />
              </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-5xl font-bold tabular-nums tracking-widest drop-shadow-sm">
                      {formatTime(displayTime)}
                  </p>
              </div>
          </div>

          {timerState.isFinished ? (
               <Button size="lg" variant="default" onClick={() => handleStop(true)} className="w-full py-8 text-2xl">
                  <Square className="mr-4 h-8 w-8" /> Save Session
              </Button>
          ) : (
               <Button size="lg" variant="destructive" onClick={() => handleStop(true)} className="w-full py-8 text-2xl">
                  <Square className="mr-4 h-8 w-8" /> Stop & Save
              </Button>
          )}
           <Button variant="ghost" onClick={() => handleStop(false)}>
              <TimerOff className="mr-2 h-4 w-4"/>
              Cancel Session
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="text-4xl font-bold font-headline">Start a New {mode === 'timer' ? 'Timer' : 'Stopwatch'}</h1>
          <p className="text-muted-foreground">Select a subject and type to begin tracking your time.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
              <div className="grid gap-2 col-span-2 sm:col-span-1">
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
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="type-select" className="text-lg">Type</Label>
                  <Select onValueChange={(v) => setTimerState(prev => ({...prev, type: v as Activity['type']}))} defaultValue={timerState.type}>
                      <SelectTrigger id="type-select" className="py-6 text-lg">
                          <SelectValue placeholder="Select an activity type" />
                      </SelectTrigger>
                      <SelectContent>
                          {activityTypes.map((t) => (
                          <SelectItem key={t} value={t} className="text-lg">{t}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>
          {mode === 'timer' && (
            <div className="grid gap-2 text-left">
                <Label htmlFor="duration-input" className="text-lg">Duration (minutes)</Label>
                <Input
                  id="duration-input"
                  type="number"
                  value={timerState.duration}
                  onChange={(e) => setTimerState(prev => ({...prev, duration: parseInt(e.target.value, 10) || 0, remainingTime: (parseInt(e.target.value, 10) || 0) * 60 }))}
                  className="py-6 text-lg"
                  placeholder="e.g., 25"
                />
            </div>
          )}
          <Button size="lg" onClick={handleStart} className="w-full py-8 text-2xl">
              <Play className="mr-4 h-8 w-8" /> Start {mode === 'timer' ? 'Timer' : 'Stopwatch'}
          </Button>
           <Button variant="ghost" onClick={() => router.push('/activities')}>
              Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
