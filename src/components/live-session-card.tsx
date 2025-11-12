
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
import { Play, Timer, Clock, Trash2, Plus, Minus } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { ManualEntryDialog } from "./manual-entry-dialog";


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

export function LiveSessionCard({ onStartTimer }: LiveSessionCardProps) {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState<Activity['type']>('Study');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(25);
  
  const [pastActivityNames, setPastActivityNames] = useLocalStorage<string[]>('past-activity-names', []);
  const [activityTypes, setActivityTypes] = useLocalStorage<string[]>(
    "custom-activity-types",
    ["Study", "Class", "Break", "Other"]
  );
   const [problemCategories, setProblemCategories] = useLocalStorage<string[]>(
    "custom-problem-categories",
    []
  );

  const [isAddNameOpen, setIsAddNameOpen] = useState(false);
  const [isManageNamesOpen, setIsManageNamesOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");

  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState("");
  
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

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
     if (activityType === 'Study' && !category) {
      toast({
        variant: "destructive",
        title: "No Category",
        description: "Please select a category for your study session.",
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
    onStartTimer({ mode, activityName, activityType, duration, category });
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
  
  const handleAddNewCategory = () => {
    if (newCategory.trim() && !problemCategories.includes(newCategory.trim())) {
      const cat = newCategory.trim();
      setProblemCategories([...problemCategories, cat]);
      setCategory(cat);
      setIsAddCategoryOpen(false);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setProblemCategories(problemCategories.filter(cat => cat !== categoryToRemove));
    if (category === categoryToRemove) {
      setCategory('');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>Start a Live Session</CardTitle>
              <CardDescription>Track your focus in real-time with a timer or stopwatch.</CardDescription>
            </div>
            <ManualEntryDialog />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {activityType === 'Study' && (
                       <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="category-select">Category</Label>
                        <Select
                            onValueChange={(value) => {
                                if (value === "add_new") setIsAddCategoryOpen(true);
                                else if (value === "manage") setIsManageCategoriesOpen(true);
                                else setCategory(value);
                            }}
                            value={category}
                        >
                            <SelectTrigger id="category-select">
                                <SelectValue placeholder="Select or create category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {problemCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                                {problemCategories.length > 0 && <SelectSeparator />}
                                <SelectItem value="add_new">Add New...</SelectItem>
                                <SelectItem value="manage" className="text-muted-foreground">Manage Categories...</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    )}
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
    
     <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
            <div className="py-4">
                <Input
                    placeholder="e.g., Organic Chemistry"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      }
                    }}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
                <Button onClick={handleAddNewCategory}>Add</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Manage Categories</DialogTitle></DialogHeader>
            <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
                {problemCategories.length > 0 ?
                    problemCategories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-2 rounded-md border">
                            <span>{cat}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCategory(cat)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))
                    : <p className="text-sm text-muted-foreground text-center">No custom categories added yet.</p>
                }
            </div>
            <DialogFooter>
                <Button onClick={() => setIsManageCategoriesOpen(false)}>Done</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
