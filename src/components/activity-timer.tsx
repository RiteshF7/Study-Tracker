
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

const RING_RADIUS = 115;
const VIEWBOX_PADDING = 28;
const VIEWBOX_SIZE = RING_RADIUS * 2 + VIEWBOX_PADDING;
const VIEWBOX_CENTER = VIEWBOX_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  const progress = mode === 'timer' && totalSecondsInDuration > 0
    ? (totalSecondsInDuration - timerState.remainingTime) / totalSecondsInDuration
    : 0;
  const ringStrokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center  text-center">
      {timerState.isTiming || timerState.isFinished ? (
        <div
          className={cn(
            "flex w-full max-w-lg flex-col items-center gap-5 rounded-[24px] border border-slate-800/60 bg-slate-900/70 p-7 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-all",
            timerState.isFinished && "ring-2 ring-emerald-400/70",
          )}
        >
          <p className="text-lg font-medium text-slate-300">
            {timerState.isFinished ? "Great job! Session completed." : "Timing session :"}
          </p>
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-4xl font-semibold font-headline text-transparent drop-shadow-lg sm:text-5xl">
            {timerState.subject}
          </h1>

          <div className="relative flex aspect-square w-full max-w-[240px] items-center justify-center">
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            >
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#bbf7d0" }} />
                  <stop offset="100%" style={{ stopColor: "#4ade80" }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                className="text-slate-800/70"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                r={RING_RADIUS}
                cx={VIEWBOX_CENTER}
                cy={VIEWBOX_CENTER}
              />
              <circle
                stroke={timerState.isFinished ? "#f87171" : "url(#progressGradient)"}
                strokeWidth="16"
                strokeLinecap="round"
                fill="transparent"
                r={RING_RADIUS}
                cx={VIEWBOX_CENTER}
                cy={VIEWBOX_CENTER}
                style={{
                  strokeDasharray: RING_CIRCUMFERENCE,
                  strokeDashoffset: mode === "timer" ? ringStrokeDashoffset : undefined,
                  transition: "stroke-dashoffset 0.8s ease-out",
                  filter: "url(#glow)",
                }}
              />
            </svg>
            <div className="relative flex flex-col items-center justify-center">
              <p className="font-mono text-xl font-semibold tracking-[0.3em] text-slate-100 drop-shadow-xl sm:text-2xl">
                {formatTime(displayTime)}
              </p>
              <span className="mt-2 text-xs uppercase tracking-[0.45em] text-emerald-200/80">
                {mode === "timer" ? "Focus Timer" : "Stopwatch"}
              </span>
            </div>
          </div>

          {timerState.isFinished ? (
            <Button
              size="lg"
              onClick={() => handleStop(true)}
              className="group w-full max-w-xl rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/30 via-emerald-400/25 to-emerald-500/30 px-6 py-5 text-base font-medium text-emerald-50 backdrop-blur hover:from-emerald-500/40 hover:to-emerald-400/35"
            >
              <Square className="mr-3 h-6 w-6 transition-transform group-hover:scale-105" /> Save Session
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => handleStop(true)}
              className="group w-full max-w-xl rounded-2xl border border-rose-400/40 bg-white/10 px-6 py-5 text-base font-medium text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl hover:bg-white/16"
            >
              <Square className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" /> Stop and Save
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleStop(false)} className="text-slate-400 hover:text-slate-100">
            <TimerOff className="mr-2 h-4 w-4" />
            Cancel Session
          </Button>
        </div>
      ) : (
        <div className="flex w-full max-w-2xl flex-col gap-6 rounded-[24px] border border-slate-800/60 bg-slate-900/65 p-8 text-left shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur">
          <h1 className="text-center text-3xl font-semibold font-headline text-slate-100">
            Start a New {mode === "timer" ? "Timer" : "Stopwatch"}
          </h1>
          <p className="text-center text-sm text-slate-400">
            Personalize your session to stay focused. Choose your subject, activity type, and duration to begin.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="subject-select" className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Subject
              </Label>
              <Select
                onValueChange={(val) => setTimerState((prev) => ({ ...prev, subject: val }))}
                value={timerState.subject}
                defaultValue={timerState.subject}
              >
                <SelectTrigger className="h-12 rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 text-base font-medium text-slate-100 shadow-inner shadow-slate-900/60">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {problemSubjects.map((s) => (
                    <SelectItem key={s} value={s} className="text-base">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type-select" className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Type
              </Label>
              <Select
                onValueChange={(v) => setTimerState((prev) => ({ ...prev, type: v as Activity["type"] }))}
                defaultValue={timerState.type}
              >
                <SelectTrigger className="h-12 rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 text-base font-medium text-slate-100 shadow-inner shadow-slate-900/60">
                  <SelectValue placeholder="Select an activity type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((t) => (
                    <SelectItem key={t} value={t} className="text-base">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {mode === "timer" && (
            <div className="grid gap-2">
              <Label htmlFor="duration-input" className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Duration (minutes)
              </Label>
              <Input
                id="duration-input"
                type="number"
                value={timerState.duration}
                onChange={(e) =>
                  setTimerState((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value, 10) || 0,
                    remainingTime: (parseInt(e.target.value, 10) || 0) * 60,
                  }))
                }
                className="h-12 rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 text-base font-medium text-slate-100 shadow-inner shadow-slate-900/60"
                placeholder="25"
              />
            </div>
          )}
          <Button
            size="lg"
            onClick={handleStart}
            className="group w-full rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-emerald-500/20 px-6 py-5 text-base font-medium text-emerald-100 backdrop-blur hover:from-emerald-500/30 hover:to-teal-400/20"
          >
            <Play className="mr-3 h-6 w-6 transition-transform group-hover:translate-x-1" /> Start {mode === "timer" ? "Timer" : "Stopwatch"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/activities")} className="text-slate-400 hover:text-slate-100">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
