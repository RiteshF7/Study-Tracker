
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Square, TimerOff } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
};

type TimerMode = 'timer' | 'stopwatch';

interface ActivityTimerProps {
    mode: TimerMode;
    initialActivityName: string;
    initialActivityType: Activity['type'];
    initialCategory?: string;
    initialDuration: number; // in minutes
    onSessionEnd: () => void;
}

const CIRCLE_RADIUS = 125;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function ActivityTimer({
    mode,
    initialActivityName,
    initialActivityType,
    initialCategory,
    initialDuration,
    onSessionEnd
}: ActivityTimerProps) {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const activitiesCollection = useMemo(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const [isTiming, setIsTiming] = useState(false);
  const [remainingTime, setRemainingTime] = useState(initialDuration * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
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
  }, []);
  
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  const handleStart = useCallback(() => {
    setIsTiming(true);
    setStartTime(Date.now());
    setIsFinished(false);
    if (mode === 'timer') {
      setRemainingTime(initialDuration * 60);
    } else {
      setElapsedTime(0);
    }
  }, [mode, initialDuration]);

  // Auto-start the timer when the component mounts
  useEffect(() => {
    handleStart();
  }, [handleStart]);


  useEffect(() => {
    if (isTiming && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (mode === 'timer') {
          const remaining = initialDuration * 60 - elapsed;
          if (remaining <= 0) {
            setRemainingTime(0);
            setIsTiming(false);
            setIsFinished(true);
            playSound();
            toast({
                title: "Timer Finished!",
                description: `Your session for "${initialActivityName}" is complete.`,
            });
            clearTimer();
          } else {
            setRemainingTime(remaining);
          }
        } else { // Stopwatch
          setElapsedTime(elapsed);
        }
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isTiming, startTime, initialDuration, initialActivityName, mode, clearTimer, playSound, toast]);


  const handleStop = (save: boolean) => {
    clearTimer();
    
    if (save && activitiesCollection && user && startTime) {
        let durationInMinutes = 0;
        if (mode === 'timer') {
            const elapsedSeconds = initialDuration * 60 - remainingTime;
            durationInMinutes = Math.round(elapsedSeconds / 60);
        } else { // stopwatch
            durationInMinutes = Math.round(elapsedTime / 60);
        }

        if (durationInMinutes > 0) {
            const newActivity: Omit<Activity, 'id' | 'createdAt'> = {
                name: initialActivityName,
                type: initialActivityType,
                category: initialCategory,
                duration: durationInMinutes,
                date: new Date().toISOString().split("T")[0],
                startTime: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                userId: user.uid,
            };
            
            addDocumentNonBlocking(activitiesCollection, { ...newActivity, createdAt: serverTimestamp() });
            
            toast({
                title: "Activity Logged!",
                description: `${initialActivityName} for ${durationInMinutes} ${durationInMinutes > 1 ? 'minutes' : 'minute'} has been saved.`,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Activity Not Logged",
                description: "Duration was zero. No activity was saved.",
            });
        }
    }

    onSessionEnd();
  };
  
  const displayTime = mode === 'timer' ? remainingTime : elapsedTime;
  const totalSecondsInDuration = mode === 'timer' ? initialDuration * 60 : 0;
  
  const progress = useMemo(() => {
    if (mode === 'stopwatch' || totalSecondsInDuration === 0) return 0;
    return (totalSecondsInDuration - remainingTime) / totalSecondsInDuration;
  }, [mode, totalSecondsInDuration, remainingTime]);

  const strokeDashoffset = useMemo(() => {
    const elapsedRatio = mode === 'stopwatch' 
      ? (elapsedTime % 60) / 60
      : progress;
    return CIRCLE_CIRCUMFERENCE * (1 - elapsedRatio);
  }, [mode, progress, elapsedTime]);


  return (
    <div className="w-full max-w-lg mx-auto text-center pt-8">
      <div className={cn("space-y-4 flex flex-col items-center", isFinished && "animate-blink")}>
        <p className="text-xl text-muted-foreground">{isFinished ? "Session Finished!" : `Timing session for:`}</p>
        <h1 className="text-5xl font-bold font-headline">{initialActivityName}</h1>
        
        <div className={cn("relative w-[300px] h-[300px]", mode === 'stopwatch' && isTiming && 'animate-pulse')}>
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                </defs>
                <circle
                    className="text-border"
                    stroke="currentColor"
                    strokeWidth="15"
                    fill="transparent"
                    r={CIRCLE_RADIUS}
                    cx="150"
                    cy="150"
                />
                <circle
                    className="transition-all duration-1000 ease-linear"
                    stroke={isFinished ? "hsl(var(--destructive))" : "url(#progressGradient)"}
                    strokeWidth="15"
                    strokeLinecap="round"
                    fill="transparent"
                    r={CIRCLE_RADIUS}
                    cx="150"
                    cy="150"
                    style={{
                        strokeDasharray: CIRCLE_CIRCUMFERENCE,
                        strokeDashoffset: strokeDashoffset,
                    }}
                />
            </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-6xl font-bold tabular-nums tracking-wider drop-shadow-lg">
                    {formatTime(displayTime)}
                </p>
            </div>
        </div>

        {isFinished ? (
             <Button size="lg" variant="default" onClick={() => handleStop(true)} className="w-full py-6 text-xl">
                <Square className="mr-4 h-6 w-6" /> Save Session
            </Button>
        ) : (
             <Button size="lg" variant="destructive" onClick={() => handleStop(true)} className="w-full py-6 text-xl">
                <Square className="mr-4 h-6 w-6" /> Stop & Save
            </Button>
        )}
         <Button variant="ghost" onClick={() => handleStop(false)}>
            <TimerOff className="mr-2 h-4 w-4"/>
            Cancel Session
        </Button>
      </div>
    </div>
  );
}
