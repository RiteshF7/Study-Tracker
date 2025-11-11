
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
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Timer, Clock, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";

interface LiveSessionCardProps {
    onStartTimer: (config: {
        mode: 'timer' | 'stopwatch',
        activityName: string,
        activityType: Activity['type'],
        duration: number,
    }) => void;
}

export function LiveSessionCard({ onStartTimer }: LiveSessionCardProps) {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState<Activity['type']>('Study');
  const [duration, setDuration] = useState(25);
  
  const [pastActivityNames, setPastActivityNames] = useLocalStorage<string[]>('past-activity-names', []);
  const [activityTypes, setActivityTypes] = useLocalStorage<string[]>(
    "custom-activity-types",
    ["Study", "Class", "Break", "Other"]
  );

  const [isAddNameOpen, setIsAddNameOpen] = useState(false);
  const [isManageNamesOpen, setIsManageNamesOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");

  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState("");

  const { toast } = useToast();

  const handleStart = () => {
    if (!activityName) {
      toast({
        variant: "destructive",
        title: "No Activity Name",
        description: "Please enter a name for your activity.",
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
    onStartTimer({ mode, activityName, activityType, duration });
  };

  const handleAddNewName = () => {
    if (newActivityName.trim() && !pastActivityNames.includes(newActivityName.trim())) {
      const newName = newActivityName.trim();
      setPastActivityNames([...pastActivityNames, newName]);
      setActivityName(newName);
      setIsAddNameOpen(false);
      setNewActivityName("");
    } else if (pastActivityNames.includes(newActivityName.trim())) {
      setActivityName(newActivityName.trim());
      setIsAddNameOpen(false);
      setNewActivityName("");
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    setPastActivityNames(pastActivityNames.filter(name => name !== nameToRemove));
    if (activityName === nameToRemove) {
      setActivityName('');
    }
  };

  const handleAddNewType = () => {
    if (newActivityType.trim() && !activityTypes.includes(newActivityType.trim())) {
      const newType = newActivityType.trim();
      setActivityTypes([...activityTypes, newType]);
      setActivityType(newType as Activity['type']);
      setIsAddTypeOpen(false);
      setNewActivityType("");
    } else if (activityTypes.includes(newActivityType.trim())) {
      setActivityType(newActivityType.trim() as Activity['type']);
      setIsAddTypeOpen(false);
      setNewActivityType("");
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    setActivityTypes(activityTypes.filter(type => type !== typeToRemove));
    if (activityType === typeToRemove) {
      setActivityType('Other');
    }
  };

  return (
    <>
    <Card>
        <CardHeader>
            <CardTitle>Start a Live Session</CardTitle>
            <CardDescription>Track your focus in real-time with a timer or stopwatch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Tabs defaultValue="timer" onValueChange={(v) => setMode(v as 'timer' | 'stopwatch')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="timer"><Timer className="mr-2 h-4 w-4" />Timer</TabsTrigger>
                    <TabsTrigger value="stopwatch"><Clock className="mr-2 h-4 w-4" />Stopwatch</TabsTrigger>
                </TabsList>
            </Tabs>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="activity-name">Activity Name</Label>
                  <Select
                      onValueChange={(value) => {
                        if (value === "add_new") setIsAddNameOpen(true);
                        else if (value === "manage") setIsManageNamesOpen(true);
                        else setActivityName(value);
                      }}
                      value={activityName}
                    >
                      <SelectTrigger id="activity-name">
                          <SelectValue placeholder="Select or create..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pastActivityNames.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                        {pastActivityNames.length > 0 && <SelectSeparator />}
                        <SelectItem value="add_new">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-muted-foreground">Manage Names...</SelectItem>
                      </SelectContent>
                    </Select>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="type-select">Type</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "add_new") setIsAddTypeOpen(true);
                      else if (value === "manage") setIsManageTypesOpen(true);
                      else setActivityType(value as Activity['type']);
                    }}
                    value={activityType}
                  >
                    <SelectTrigger id="type-select">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        {activityTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="add_new">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-muted-foreground">Manage Types...</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
          </div>
           {mode === 'timer' && (
            <div className="grid gap-2">
                <Label htmlFor="duration-input">Duration (minutes)</Label>
                <Input
                  id="duration-input"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g., 25"
                />
            </div>
          )}
           <Button size="lg" onClick={handleStart} className="w-full">
              <Play className="mr-2 h-5 w-5" /> Start {mode === 'timer' ? 'Timer' : 'Stopwatch'}
          </Button>
        </CardContent>
    </Card>
    
    {/* Dialogs for managing names and types */}
    <Dialog open={isAddNameOpen} onOpenChange={setIsAddNameOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Activity Name</DialogTitle></DialogHeader>
        <div className="py-4"><Input placeholder="e.g., Quantum Physics" value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNewName()} /></div>
        <DialogFooter><Button variant="outline" onClick={() => setIsAddNameOpen(false)}>Cancel</Button><Button onClick={handleAddNewName}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isManageNamesOpen} onOpenChange={setIsManageNamesOpen}>
      <DialogContent><DialogHeader><DialogTitle>Manage Activity Names</DialogTitle></DialogHeader>
        <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
          {pastActivityNames.length > 0 ? pastActivityNames.map(name => (
              <div key={name} className="flex items-center justify-between p-2 rounded-md border"><span>{name}</span><Button variant="ghost" size="icon" onClick={() => handleRemoveName(name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          )) : <p className="text-sm text-muted-foreground text-center">No custom names.</p>}
        </div><DialogFooter><Button onClick={() => setIsManageNamesOpen(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
      <DialogContent><DialogHeader><DialogTitle>Add New Activity Type</DialogTitle></DialogHeader>
        <div className="py-4"><Input placeholder="e.g., Lab Work" value={newActivityType} onChange={(e) => setNewActivityType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNewType()} /></div>
        <DialogFooter><Button variant="outline" onClick={() => setIsAddTypeOpen(false)}>Cancel</Button><Button onClick={handleAddNewType}>Add</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
      <DialogContent><DialogHeader><DialogTitle>Manage Activity Types</DialogTitle></DialogHeader>
        <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
          {activityTypes.filter(t => !['Study', 'Class', 'Break', 'Other'].includes(t)).length > 0 ?
            activityTypes.filter(t => !['Study', 'Class', 'Break', 'Other'].includes(t)).map(type => (
              <div key={type} className="flex items-center justify-between p-2 rounded-md border"><span>{type}</span><Button variant="ghost" size="icon" onClick={() => handleRemoveType(type)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            )) : <p className="text-sm text-muted-foreground text-center">No custom types.</p>}
        </div><DialogFooter><Button onClick={() => setIsManageTypesOpen(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
