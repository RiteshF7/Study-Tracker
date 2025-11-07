
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
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { Activity, CourseName } from "@/lib/types";
import { activityTypes, courses, defaultSubjects } from "@/lib/types";

const manualActivitySchema = z.object({
  name: z.string().min(1, "Subject is required."),
  type: z.string().min(1, "Type is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  date: z.string().min(1, "Date is required"),
});

type UserProfile = {
  course?: CourseName;
  year?: string;
}

export function ManualActivityForm() {
  const [open, setOpen] = useState(false);
  const { firestore, user } = useFirebase();

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
    if (problemSubjects.length > 0) {
      const currentSubject = form.getValues("name");
      if (!currentSubject || !problemSubjects.includes(currentSubject)) {
        form.reset({
          ...form.formState.defaultValues,
          name: problemSubjects[0],
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [problemSubjects, form]);

  function onSubmit(values: z.infer<typeof manualActivitySchema>) {
    if (!activitiesCollection || !user) return;
    
    const newActivity: Omit<Activity, 'id' | 'createdAt'> & { createdAt: any } = {
      ...values,
      type: values.type as Activity['type'],
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(activitiesCollection, newActivity);
    
    form.reset({
      name: problemSubjects[0] || "",
      type: "Study",
      duration: 30,
      date: new Date().toISOString().split("T")[0],
    });
    setOpen(false);
  }

  return (
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
                  <FormLabel>Subject / Activity Name</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {problemSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
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
  );
}
