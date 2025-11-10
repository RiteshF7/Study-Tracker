
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { useCollection, useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { Activity } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";

const manualActivitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  date: z.string().min(1, "Date is required"),
});

export function ManualActivityForm() {
  const [open, setOpen] = useState(false);
  
  const [isAddNameOpen, setIsAddNameOpen] = useState(false);
  const [isManageNamesOpen, setIsManageNamesOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState("");
  
  const { firestore, user } = useFirebase();

  const [pastActivityNames, setPastActivityNames] = useLocalStorage<string[]>('past-activity-names', []);
  const [activityTypes, setActivityTypes] = useLocalStorage<string[]>(
    "custom-activity-types",
    ["Study", "Class", "Break", "Other"]
  );

  const activitiesCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const { data: activities } = useCollection<Activity>(activitiesCollection);

  useEffect(() => {
    if (activities) {
        const namesFromHistory = [...new Set(activities.map(a => a.name).filter(Boolean))];
        setPastActivityNames(prev => [...new Set([...prev, ...namesFromHistory])]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const form = useForm<z.infer<typeof manualActivitySchema>>({
    resolver: zodResolver(manualActivitySchema),
    defaultValues: {
      name: "",
      type: "Study",
      duration: 30,
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        type: "Study",
        duration: 30,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [form, open]);

  const handleAddNewName = () => {
    if (newActivityName.trim() && !pastActivityNames.includes(newActivityName.trim())) {
      const newName = newActivityName.trim();
      setPastActivityNames([...pastActivityNames, newName]);
      form.setValue('name', newName);
      setIsAddNameOpen(false);
      setNewActivityName("");
    } else if (pastActivityNames.includes(newActivityName.trim())) {
      form.setValue('name', newActivityName.trim());
      setIsAddNameOpen(false);
      setNewActivityName("");
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    setPastActivityNames(pastActivityNames.filter(name => name !== nameToRemove));
    if (form.getValues('name') === nameToRemove) {
      form.setValue('name', '');
    }
  };
  
  const handleAddNewType = () => {
    if (newActivityType.trim() && !activityTypes.includes(newActivityType.trim())) {
      const newType = newActivityType.trim();
      setActivityTypes([...activityTypes, newType]);
      form.setValue('type', newType);
      setIsAddTypeOpen(false);
      setNewActivityType("");
    } else if (activityTypes.includes(newActivityType.trim())) {
      form.setValue('type', newActivityType.trim());
      setIsAddTypeOpen(false);
      setNewActivityType("");
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    setActivityTypes(activityTypes.filter(type => type !== typeToRemove));
    if (form.getValues('type') === typeToRemove) {
      form.setValue('type', 'Other');
    }
  };


  function onSubmit(values: z.infer<typeof manualActivitySchema>) {
    if (!activitiesCollection || !user) return;
    
    const newActivity: Omit<Activity, 'id' | 'createdAt'> & { createdAt: any } = {
      name: values.name,
      type: values.type as Activity['type'],
      duration: values.duration,
      date: values.date,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(activitiesCollection, newActivity);
    
    setOpen(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Log Manually
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log an Activity Manually</DialogTitle>
            <DialogDescription>
              Add a past study session or other activity to your log.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Name</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "add_new") {
                          setIsAddNameOpen(true);
                        } else if (value === "manage") {
                          setIsManageNamesOpen(true);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an activity name" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pastActivityNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                         {(pastActivityNames.length > 0) && <SelectSeparator />}
                        <SelectItem value="add_new">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-muted-foreground">Manage Names...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={(value) => {
                        if (value === "add_new") {
                          setIsAddTypeOpen(true);
                        } else if (value === "manage") {
                          setIsManageTypesOpen(true);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                           {t}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="add_new">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-muted-foreground">Manage Types...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (in minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Log Activity</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
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

    