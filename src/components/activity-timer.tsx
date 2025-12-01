
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Square, TimerOff, Sparkles, Play, Pause } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Square, TimerOff, Sparkles, Play, Pause } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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

// --- Visual Effects ---

const GreenAurora = () => (
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 opacity-30 blur-xl animate-aurora pointer-events-none" />
);

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    const columns = Math.floor(canvas.width / 10);
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = '10px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(text, i * 10, drops[i] * 10);

        if (drops[i] * 10 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 rounded-full opacity-30 pointer-events-none" />;
};

const DisneySparkles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <Sparkles
          key={i}
          className="absolute text-yellow-400 animate-twinkle"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            width: `${Math.random() * 20 + 10}px`,
            height: `${Math.random() * 20 + 10}px`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

const AuroraEffect = () => (
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl animate-aurora pointer-events-none" />
);

const HeatHazeEffect = () => (
  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500/20 to-transparent animate-heat-haze pointer-events-none" />
);

const SmokeEffect = () => {
  const particles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-0">
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-16 h-16 bg-primary/20 rounded-full blur-xl animate-smoke"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

// --- Main Component ---

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
  const { theme } = useTheme();

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

  const toggleTimer = () => {
    if (isFinished) return;
    setIsTiming(!isTiming);
    if (!isTiming) {
      // Resuming
      setStartTime(Date.now() - (mode === 'stopwatch' ? elapsedTime * 1000 : (initialDuration * 60 - remainingTime) * 1000));
    }
  };

  // Auto-start
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

        <div
          className={cn(
            "relative w-[300px] h-[300px] group cursor-pointer transition-transform duration-300 hover:scale-105",
            mode === 'stopwatch' && isTiming && 'animate-pulse'
          )}
          onClick={toggleTimer}
        >
          {/* Theme Specific Backgrounds */}
          {theme === 'matrix-dark' && <MatrixRain />}
          {theme === 'disney-dark' && <DisneySparkles />}
          {theme === 'violet-dark' && <AuroraEffect />}
          {theme === 'sunset' && <HeatHazeEffect />}
          {(theme === 'peazehub' || theme === 'dark') && <GreenAurora />}
          {(mode === 'stopwatch' && isTiming) || theme === 'latte' ? <SmokeEffect /> : null}

          {/* Interactive Overlay Hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 rounded-full backdrop-blur-[2px]">
            {isTiming ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
          </div>

          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
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
              filter={theme === 'violet-dark' || theme === 'disney-dark' ? "url(#glow)" : undefined}
              style={{
                strokeDasharray: CIRCLE_CIRCUMFERENCE,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className={cn(
              "font-mono text-6xl font-bold tabular-nums tracking-wider drop-shadow-lg",
              theme === 'matrix-dark' && "animate-glitch text-green-500",
              theme === 'latte' && "font-serif text-amber-900"
            )}>
              {formatTime(displayTime)}
            </p>
          </div>
        </div>

        {
          isFinished ? (
            <Button size="lg" variant="default" onClick={() => handleStop(true)} className="w-full py-6 text-xl">
              <Square className="mr-4 h-6 w-6" /> Save Session
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={() => handleStop(true)} className="w-full py-6 text-xl">
              <Square className="mr-4 h-6 w-6" /> Stop & Save
            </Button>
          )
        }
        <Button variant="ghost" onClick={() => handleStop(false)}>
          <TimerOff className="mr-2 h-4 w-4" />
          Cancel Session
        </Button>
      </div >
    </div >
  );
}
