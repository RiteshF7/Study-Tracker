"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Activity } from "@/lib/types";
import { activityTypes } from "@/lib/types";
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

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required."),
  type: z.enum(activityTypes as [string, ...string[]], {
    required_error: "Please select an activity type.",
  }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  date: z.string().min(1, "Date is required"),
});

export function ActivityLog() {
  const [activities, setActivities] = useLocalStorage<Activity[]>("activities", []);
  const [open, setOpen] = useState(false);

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
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      ...values,
    };
    setActivities([...activities, newActivity]);
    form.reset();
    setOpen(false);
  }

  function deleteActivity(id: string) {
    setActivities(activities.filter(a => a.id !== id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Activities</CardTitle>
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
            {activities.length > 0 ? (
              [...activities].reverse().map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteActivity(activity.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No activities logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
