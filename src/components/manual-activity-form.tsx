
"use client";

import { useState, useMemo, useEffect } from "react";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useCollection, useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { Activity } from "@/lib/types";
import { activityTypes } from "@/lib/types";

const manualActivitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  date: z.string().min(1, "Date is required"),
});

export function ManualActivityForm() {
  const [open, setOpen] = useState(false);
  const [isAddNameOpen, setIsAddNameOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const { firestore, user } = useFirebase();

  const activitiesCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const { data: activities } = useCollection<Activity>(activitiesCollection);

  const pastActivityNames = useMemo(() => {
    if (!activities) return [];
    return [...new Set(activities.map(a => a.name).filter(Boolean))];
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
    if (newActivityName.trim()) {
      form.setValue('name', newActivityName.trim());
      setIsAddNameOpen(false);
      setNewActivityName("");
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
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                        <SelectItem value="add_new">Add New...</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
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
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNameOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
