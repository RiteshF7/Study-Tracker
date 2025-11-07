
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

type UserProfile = {
  course?: CourseName;
  year?: string;
}

// Helper to format time from seconds to HH:MM:SS
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
};

export function ActivityTimer() {
  const { firestore, user } = useFirebase();
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

  const [subject, setSubject] = useState(problemSubjects[0] || "");
  const [type, setType] = useState<Activity['type']>("Study");
  
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (problemSubjects.length > 0 && !subject) {
      setSubject(problemSubjects[0]);
    }
  }, [problemSubjects, subject]);
  
  useEffect(() => {
    if (isTiming) {
      const startTime = Date.now() - elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
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
  }, [isTiming]);

  const handleStart = () => {
    if (!subject) {
      toast({
        variant: "destructive",
        title: "No Subject Selected",
        description: "Please select a subject before starting the timer.",
      });
      return;
    }
    setElapsedTime(0);
    setIsTiming(true);
  };

  const handleStop = () => {
    setIsTiming(false);
    if (!activitiesCollection || !user) return;
    
    const durationInMinutes = Math.max(1, Math.round(elapsedTime / 60));

    const newActivity: Omit<Activity, 'id' | 'createdAt'> & { createdAt: any } = {
      name: subject,
      type: type,
      duration: durationInMinutes,
      date: new Date().toISOString().split("T")[0],
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(activitiesCollection, newActivity);
    
    toast({
        title: "Activity Logged!",
        description: `${subject} for ${durationInMinutes} ${durationInMinutes > 1 ? 'minutes' : 'minute'} has been saved.`,
    })

    setElapsedTime(0);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Start a Session</CardTitle>
        <CardDescription>Select a subject and type, then start the timer to begin tracking.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4">
        <div className="grid gap-2 w-full sm:w-auto sm:flex-1">
            <Label htmlFor="subject-select">Subject</Label>
            <Select onValueChange={setSubject} value={subject} defaultValue={subject} disabled={isTiming}>
                <SelectTrigger id="subject-select">
                    <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                    {problemSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="type-select">Type</Label>
            <Select onValueChange={(v) => setType(v as Activity['type'])} defaultValue={type} disabled={isTiming}>
                 <SelectTrigger id="type-select">
                    <SelectValue placeholder="Select an activity type" />
                </SelectTrigger>
                <SelectContent>
                    {activityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-end gap-4 pt-2 sm:pt-0">
             <div className="text-center">
                 <p className="font-mono text-4xl font-bold tabular-nums">
                    {formatTime(elapsedTime)}
                 </p>
                 <p className="text-xs text-muted-foreground">
                    {isTiming ? `Timing: ${subject}` : 'Timer is stopped'}
                 </p>
             </div>
            {!isTiming ? (
                <Button size="lg" onClick={handleStart} className="w-28">
                    <Play className="mr-2 h-4 w-4" /> Start
                </Button>
            ) : (
                <Button size="lg" variant="destructive" onClick={handleStop} className="w-28">
                    <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
