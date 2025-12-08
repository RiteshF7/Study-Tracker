
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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { XP_PER_MINUTE, calculateLevel, checkBadges, Badge } from "@/lib/gamification";

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

    const columns = Math.floor(canvas.width / 15); // Slightly wider columns
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Random start positions
    }

    let animationFrameId: number;

    const draw = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00FF41'; // Matrix Green
      ctx.font = '14px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(text, i * 15, drops[i] * 15);

        if (drops[i] * 15 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 rounded-full opacity-60 pointer-events-none mix-blend-screen" />;
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

  // Ensure initialDuration is a valid number
  const safeInitialDuration = useMemo(() => {
    return (typeof initialDuration === 'number' && !isNaN(initialDuration) && initialDuration > 0) ? initialDuration : 25;
  }, [initialDuration]);

  const totalSecondsInDuration = useMemo(() => safeInitialDuration * 60, [safeInitialDuration]);

  const [isTiming, setIsTiming] = useState(false);
  const [remainingTime, setRemainingTime] = useState(totalSecondsInDuration);
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
    console.log("Starting Timer...", { mode, safeInitialDuration });
    setIsTiming(true);
    setStartTime(Date.now());
    setIsFinished(false);
    if (mode === 'timer') {
      setRemainingTime(safeInitialDuration * 60);
    } else {
      setElapsedTime(0);
    }
  }, [mode, safeInitialDuration]);

  const toggleTimer = () => {
    if (isFinished) return;

    if (isTiming) {
      // Pausing
      console.log("Pausing Timer");
      setIsTiming(false);
      // No need to update startTime when pausing, just stop the interval (handled by effect)
    } else {
      // Resuming
      console.log("Resuming Timer");
      setIsTiming(true);
      // Calculate new start time to account for elapsed time
      const currentElapsed = mode === 'stopwatch' ? elapsedTime : (totalSecondsInDuration - remainingTime);
      setStartTime(Date.now() - (currentElapsed * 1000));
    }
  };

  const displayTime = useMemo(() => {
    return mode === 'timer' ? remainingTime : elapsedTime;
  }, [mode, remainingTime, elapsedTime]);

  const progress = useMemo(() => {
    if (mode === 'stopwatch' || totalSecondsInDuration === 0) return 0;
    return (totalSecondsInDuration - remainingTime) / totalSecondsInDuration;
  }, [mode, totalSecondsInDuration, remainingTime]);

  const handleStop = async (save: boolean) => {
    console.log("Stopping Timer", { save });
    setIsTiming(false);
    clearTimer();

    if (save && user) {
      try {
        const durationMinutes = mode === 'timer'
          ? (totalSecondsInDuration - remainingTime) / 60
          : elapsedTime / 60;

        // Minimum 0.1 minute (6 seconds) to save
        if (durationMinutes < 0.1) {
          toast({
            title: "Session too short",
            description: "Activity must be at least a few seconds to save.",
            variant: "destructive"
          });
          return;
        }

        const xpEarned = Math.floor(durationMinutes * XP_PER_MINUTE);

        // 1. Save Activity
        await addDocumentNonBlocking("users", user.uid, "activities", {
          name: initialActivityName,
          type: initialActivityType,
          category: initialCategory || "General",
          duration: Math.round(durationMinutes),
          timestamp: serverTimestamp(),
          xp: xpEarned
        });

        // 2. Update User XP & Level
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentXP = (userData.xp || 0) + xpEarned;
          const newLevel = calculateLevel(currentXP);

          // Check for level up
          if (newLevel > (userData.level || 1)) {
            toast({
              title: "Level Up! 🎉",
              description: `You've reached Level ${newLevel}!`,
              className: "bg-yellow-500 text-black border-none"
            });
          }

          // Check for Badges
          const newBadges = checkBadges({ ...userData, xp: currentXP, level: newLevel }, {
            type: initialActivityType,
            duration: Math.round(durationMinutes)
          });

          if (newBadges.length > 0) {
            newBadges.forEach((badge: Badge) => {
              toast({
                title: `New Badge Unlocked: ${badge.name}! 🏆`,
                description: badge.description,
                className: "bg-purple-600 text-white border-none"
              });
            });
          }

          await setDoc(userRef, {
            xp: currentXP,
            level: newLevel,
            badges: [...(userData.badges || []), ...newBadges]
          }, { merge: true });
        }

        toast({
          title: "Session Saved",
          description: `You earned ${xpEarned} XP!`,
        });
        onSessionEnd();
      } catch (error) {
        console.error("Error saving session:", error);
        toast({
          title: "Error",
          description: "Failed to save session.",
          variant: "destructive",
        });
      }
    } else {
      onSessionEnd();
    }
  };

  // Auto-start
  useEffect(() => {
    handleStart();
  }, [handleStart]);


  useEffect(() => {
    if (isTiming && startTime) {
      console.log("Interval Started");
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (mode === 'timer') {
          const remaining = totalSecondsInDuration - elapsedSeconds;
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
          setElapsedTime(elapsedSeconds);
        }
      }, 1000);
    } else {
      clearTimer();
    }
    return () => clearTimer();
  }, [isTiming, startTime, mode, totalSecondsInDuration, initialActivityName, playSound, toast, clearTimer]);

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
              theme === 'matrix-dark' && "animate-glitch text-white drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]",
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
