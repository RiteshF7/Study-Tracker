"use client";

import { useState, useMemo } from "react";
import type { Activity } from "@/lib/types";
import { activityTypes, courses, defaultSubjects, CourseName } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, Timestamp } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required."),
  type: z.enum(activityTypes as [string, ...string[]], {
    required_error: "Please select an activity type.",
  }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  date: z.string().min(1, "Date is required"),
});

type UserProfile = {
  course?: CourseName;
}

export function ActivityLog() {
  const [open, setOpen] = useState(false);
  const { firestore, user } = useFirebase();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const userDocRef = useMemoFirebase(() =>
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesCollection);

  const problemSubjects = useMemo(() => {
    const courseName = userProfile?.course;
    if (courseName && courses[courseName]) {
      return courses[courseName].subjects;
    }
    return courses["General Studies"].subjects;
  }, [userProfile]);


  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      type: "Study",
      duration: 30,
      date: new Date().toISOString().split("T")[0],
    },
  });

  function onSubmit(values: z.infer<typeof activitySchema>) {
    if (!activitiesCollection || !user) return;
    const newActivity: Omit<Activity, 'id' | 'createdAt'> & { createdAt: any } = {
      ...values,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(activitiesCollection, newActivity);
    form.reset();
    setOpen(false);
  }

  function deleteActivity(id: string) {
    if (!activitiesCollection) return;
    const docRef = doc(activitiesCollection, id);
    deleteDocumentNonBlocking(docRef);
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (selectedSubjects.length === 0) return activities;
    // This is a simple text search. 
    // A more robust solution might involve adding a 'subject' field to the Activity type.
    return activities.filter(activity => 
      selectedSubjects.some(subject => activity.name.toLowerCase().includes(subject.toLowerCase()))
    );
  }, [activities, selectedSubjects]);
  
  const sortedActivities = useMemo(() => {
    if (!filteredActivities) return [];
    return [...filteredActivities].sort((a, b) => {
        const timeA = a.createdAt?.toDate?.().getTime() || 0;
        const timeB = b.createdAt?.toDate?.().getTime() || 0;
        return timeB - timeA;
      })
  },[filteredActivities]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <CardTitle>Your Activities</CardTitle>
        </div>
         <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log a New Activity</DialogTitle>
              <DialogDescription>
                Track what you've been working on.
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
                      <FormControl>
                        <Input placeholder="e.g., Physics Chapter 3" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an activity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <FormLabel>Duration (minutes)</FormLabel>
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
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 p-4 border-b">
            <Label className="font-semibold self-center">Filter by subject:</Label>
            {problemSubjects.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                        id={`subject-${subject}`}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => handleSubjectChange(subject)}
                    />
                    <Label htmlFor={`subject-${subject}`} className="font-normal">{subject}</Label>
                </div>
            ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading activities...
                </TableCell>
              </TableRow>
            ) : sortedActivities.length > 0 ? (
              sortedActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteActivity(activity.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No activities logged yet for this subject.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
