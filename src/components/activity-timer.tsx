
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Square, TimerOff, X, Trash2, Settings } from "lucide-react";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Input } from "./ui/input";
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

type TimerState = {
  activityName: string;
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

const CIRCLE_RADIUS = 175;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function ActivityTimer({ mode }: { mode: TimerMode }) {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const [timerState, setTimerState] = useLocalStorage<TimerState>(`activity-session-state-${mode}`, {
    activityName: '',
    type: 'Study',
    isTiming: false,
    remainingTime: 25 * 60,
    duration: 25,
    elapsedTime: 0,
    startTime: null,
    isFinished: false,
  });

  const [isAddNameOpen, setIsAddNameOpen] = useState(false);
  const [isManageNamesOpen, setIsManageNamesOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [pastActivityNames, setPastActivityNames] = useLocalStorage<string[]>('past-activity-names', []);

  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState("");
  const [activityTypes, setActivityTypes] = useLocalStorage<string[]>(
    "custom-activity-types",
    ["Study", "Class", "Break", "Other"]
  );

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
            toast({
                title: "Timer Finished!",
                description: `Your session for "${timerState.activityName}" is complete.`,
            });
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
  }, [timerState.isTiming, timerState.startTime, timerState.duration, timerState.activityName, setTimerState, mode, clearTimer, toast]);

  const handleAddNewName = () => {
    if (newActivityName.trim() && !pastActivityNames.includes(newActivityName.trim())) {
      const newName = newActivityName.trim();
      setPastActivityNames([...pastActivityNames, newName]);
      setTimerState(prev => ({...prev, activityName: newName}));
      setIsAddNameOpen(false);
      setNewActivityName("");
    } else if (pastActivityNames.includes(newActivityName.trim())) {
      setTimerState(prev => ({...prev, activityName: newActivityName.trim()}));
      setIsAddNameOpen(false);
      setNewActivityName("");
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    setPastActivityNames(pastActivityNames.filter(name => name !== nameToRemove));
     if (timerState.activityName === nameToRemove) {
      setTimerState(prev => ({...prev, activityName: ''}));
    }
  };

  const handleAddNewType = () => {
    if (newActivityType.trim() && !activityTypes.includes(newActivityType.trim())) {
      const newType = newActivityType.trim();
      setActivityTypes([...activityTypes, newType]);
      setTimerState(prev => ({...prev, type: newType as Activity['type']}));
      setIsAddTypeOpen(false);
      setNewActivityType("");
    } else if (activityTypes.includes(newActivityType.trim())) {
      setTimerState(prev => ({...prev, type: newActivityType.trim() as Activity['type']}));
      setIsAddTypeOpen(false);
      setNewActivityType("");
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    setActivityTypes(activityTypes.filter(type => type !== typeToRemove));
    if (timerState.type === typeToRemove) {
      setTimerState(prev => ({...prev, type: 'Other'}));
    }
  };


  const handleStart = () => {
    if (!timerState.activityName) {
      toast({
        variant: "destructive",
        title: "No Activity Name",
        description: "Please enter a name for your activity.",
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
                name: timerState.activityName,
                type: timerState.type,
                duration: durationInMinutes,
                date: new Date().toISOString().split("T")[0],
                userId: user.uid,
                createdAt: serverTimestamp(),
            };
            
            addDocumentNonBlocking(activitiesCollection, newActivity);
            
            toast({
                title: "Activity Logged!",
                description: `${timerState.activityName} for ${durationInMinutes} ${durationInMinutes > 1 ? 'minutes' : 'minute'} has been saved.`,
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
      activityName: '',
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
  
  const progress = useMemo(() => {
    if (mode === 'stopwatch' || totalSecondsInDuration === 0) return 0;
    return (totalSecondsInDuration - timerState.remainingTime) / totalSecondsInDuration;
  }, [mode, totalSecondsInDuration, timerState.remainingTime]);

  const strokeDashoffset = useMemo(() => {
    const elapsedRatio = mode === 'stopwatch' 
      ? (timerState.elapsedTime % 60) / 60
      : progress;
    return CIRCLE_CIRCUMFERENCE * (1 - elapsedRatio);
  }, [mode, progress, timerState.elapsedTime]);


  return (
    <>
    <div className="w-full max-w-lg mx-auto text-center pt-8">
      {timerState.isTiming || timerState.isFinished ? (
        <div className={cn("space-y-8 flex flex-col items-center", timerState.isFinished && "animate-blink")}>
          <p className="text-2xl text-muted-foreground">{timerState.isFinished ? "Session Finished!" : `Timing session for (${mode}):`}</p>
          <h1 className="text-6xl font-bold font-headline">{timerState.activityName}</h1>
          
          <div className={cn("relative w-[400px] h-[400px]", mode === 'stopwatch' && timerState.isTiming && 'animate-pulse')}>
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 400 400">
                  <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                  </defs>
                  <circle
                      className="text-border"
                      stroke="currentColor"
                      strokeWidth="20"
                      fill="transparent"
                      r={CIRCLE_RADIUS}
                      cx="200"
                      cy="200"
                  />
                  <circle
                      className="transition-all duration-1000 ease-linear"
                      stroke={timerState.isFinished ? "hsl(var(--destructive))" : "url(#progressGradient)"}
                      strokeWidth="20"
                      strokeLinecap="round"
                      fill="transparent"
                      r={CIRCLE_RADIUS}
                      cx="200"
                      cy="200"
                      style={{
                          strokeDasharray: CIRCLE_CIRCUMFERENCE,
                          strokeDashoffset: strokeDashoffset,
                      }}
                  />
              </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-7xl font-bold tabular-nums tracking-wider drop-shadow-lg">
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
          <p className="text-muted-foreground">Select a type and name to begin tracking your time.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
              <div className="grid gap-2 col-span-2">
                  <Label htmlFor="activity-name" className="text-lg">Activity Name</Label>
                  <Select
                      onValueChange={(value) => {
                        if (value === "add_new") {
                          setIsAddNameOpen(true);
                        } else if (value === "manage") {
                            setIsManageNamesOpen(true);
                        } else {
                          setTimerState(prev => ({...prev, activityName: value}));
                        }
                      }}
                      value={timerState.activityName}
                    >
                      <SelectTrigger id="activity-name" className="py-6 text-lg">
                          <SelectValue placeholder="Select an activity name" />
                      </SelectTrigger>
                      <SelectContent>
                        {pastActivityNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-lg">
                            {name}
                          </SelectItem>
                        ))}
                        {(pastActivityNames.length > 0) && <SelectSeparator />}
                        <SelectItem value="add_new" className="text-lg">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-lg text-muted-foreground">Manage Names...</SelectItem>
                      </SelectContent>
                    </Select>
              </div>
              <div className="grid gap-2 col-span-2">
                  <Label htmlFor="type-select" className="text-lg">Type</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "add_new") {
                        setIsAddTypeOpen(true);
                      } else if (value === "manage") {
                        setIsManageTypesOpen(true);
                      } else {
                        setTimerState(prev => ({...prev, type: value as Activity['type']}));
                      }
                    }}
                    value={timerState.type}
                  >
                    <SelectTrigger id="type-select" className="py-6 text-lg">
                        <SelectValue placeholder="Select an activity type" />
                    </SelectTrigger>
                    <SelectContent>
                        {activityTypes.map((t) => (
                          <SelectItem key={t} value={t} className="text-lg">
                            {t}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="add_new" className="text-lg">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-lg text-muted-foreground">Manage Types...</SelectItem>
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
     <Dialog open={isAddNameOpen} onOpenChange={setIsAddNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Quantum Physics"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewName();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNameOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Lab Work"
              value={newActivityType}
              onChange={(e) => setNewActivityType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewType();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTypeOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewType}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isManageNamesOpen} onOpenChange={setIsManageNamesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Activity Names</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {pastActivityNames.length > 0 ? pastActivityNames.map(name => (
                <div key={name} className="flex items-center justify-between p-2 rounded-md border">
                    <span>{name}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveName(name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center">No custom names to manage.</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageNamesOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Activity Types</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {activityTypes.filter(t => !['Study', 'Class', 'Break', 'Other'].includes(t)).length > 0 ? 
             activityTypes.filter(t => !['Study', 'Class', 'Break', 'Other'].includes(t)).map(type => (
                <div key={type} className="flex items-center justify-between p-2 rounded-md border">
                    <span>{type}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveType(type)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center">No custom types to manage.</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageTypesOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
