
"use client";

import { useState } from "react";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Timer, Clock, Trash2, Plus, Minus } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";

interface LiveSessionCardProps {
    onStartTimer: (config: {
        mode: 'timer' | 'stopwatch',
        activityName: string,
        activityType: Activity['type'],
        category?: string,
        duration: number,
    }) => void;
}

const durationPresets = [15, 25, 45, 60];
const sortingOptions = ['RED', 'YELLOW', 'GREEN'];

export function LiveSessionCard({ onStartTimer }: LiveSessionCardProps) {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [activityType, setActivityType] = useState<Activity['type']>('Study');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(25);
  
  const [customSubjects, setCustomSubjects] = useLocalStorage<string[]>(
    "live-session-subjects",
    ['Physics', 'Chemistry', 'Maths']
  );

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  const { toast } = useToast();

  const handleStart = () => {
     if (!subject) {
      toast({
        variant: "destructive",
        title: "No Subject",
        description: "Please select a subject for your study session.",
      });
      return;
    }
    if (mode === 'timer' && duration <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Duration",
        description: "Please set a duration greater than 0 for the timer.",
      });
      return;
    }
    onStartTimer({ mode, activityName: subject, activityType, duration, category: subject });
  };
  
  const handleAddNewSubject = () => {
    if (newSubject.trim() && !customSubjects.includes(newSubject.trim())) {
      const sub = newSubject.trim();
      setCustomSubjects([...customSubjects, sub]);
      setSubject(sub);
      setIsAddSubjectOpen(false);
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setCustomSubjects(customSubjects.filter(sub => sub !== subjectToRemove));
    if (subject === subjectToRemove) {
      setSubject('');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
            <div>
              <CardTitle>Start a Live Session</CardTitle>
              <CardDescription>Track your focus in real-time with a timer or stopwatch.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                <div className="space-y-8">
                    <Tabs defaultValue="timer" onValueChange={(v) => setMode(v as 'timer' | 'stopwatch')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="timer"><Timer className="mr-2 h-4 w-4" />Timer</TabsTrigger>
                            <TabsTrigger value="stopwatch"><Clock className="mr-2 h-4 w-4" />Stopwatch</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subject-select">Subject</Label>
                            <Select
                                onValueChange={(value) => {
                                    if (value === "add_new") setIsAddSubjectOpen(true);
                                    else if (value === "manage") setIsManageSubjectsOpen(true);
                                    else setSubject(value);
                                }}
                                value={subject}
                            >
                                <SelectTrigger id="subject-select">
                                    <SelectValue placeholder="Select or create subject..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customSubjects.map((sub) => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                    {customSubjects.length > 0 && <SelectSeparator />}
                                    <SelectItem value="add_new">Add New...</SelectItem>
                                    <SelectItem value="manage" className="text-muted-foreground">Manage Subjects...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sorting-select">Sorting</Label>
                            <Select
                                onValueChange={(value) => setActivityType(value as Activity['type'])}
                                value={activityType}
                            >
                                <SelectTrigger id="sorting-select">
                                    <SelectValue placeholder="Select priority..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortingOptions.map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2 mt-8">
                        <Label htmlFor="duration-input">Duration (minutes)</Label>
                        <div className="flex items-center gap-2">
                            <div className="grid grid-cols-4 gap-2 flex-1">
                                {durationPresets.map((preset) => (
                                    <Button
                                        key={preset}
                                        variant={duration === preset ? "default" : "outline"}
                                        onClick={() => setDuration(preset)}
                                        className="h-10"
                                    >
                                        {preset}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => setDuration(d => Math.max(1, d - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    id="duration-input"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                                    placeholder="Custom"
                                    className="w-16 h-10 text-center"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => setDuration(d => d + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <Button size="lg" onClick={handleStart} className="w-32 h-32 text-2xl rounded-full flex flex-col">
                        <Play className="h-16 w-16" /> 
                        <span>Start</span>
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
    
     <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                    Enter a new subject name to add to your list.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input
                    placeholder="e.g., Organic Chemistry"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewSubject();
                      }
                    }}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)}>Cancel</Button>
                <Button onClick={handleAddNewSubject}>Add</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isManageSubjectsOpen} onOpenChange={setIsManageSubjectsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Subjects</DialogTitle>
                <DialogDescription>
                    Remove subjects you no longer need.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
                {customSubjects.length > 0 ?
                    customSubjects.map(sub => (
                        <div key={sub} className="flex items-center justify-between p-2 rounded-md border">
                            <span>{sub}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(sub)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))
                    : <p className="text-sm text-muted-foreground text-center">No custom subjects added yet.</p>
                }
            </div>
            <DialogFooter>
                <Button onClick={() => setIsManageSubjectsOpen(false)}>Done</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
