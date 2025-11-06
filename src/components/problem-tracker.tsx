"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Problem } from "@/lib/types";
import { problemSubjects } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const problemSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  count: z.coerce.number().min(1, "Must solve at least 1 problem."),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export function ProblemTracker() {
  const [problems, setProblems] = useLocalStorage<Problem[]>("problems", []);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      subject: "Mathematics",
      count: 10,
      notes: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  function onSubmit(values: z.infer<typeof problemSchema>) {
    const newProblem: Problem = {
      id: crypto.randomUUID(),
      ...values,
      notes: values.notes || "",
    };
    setProblems([...problems, newProblem]);
    form.reset();
    setOpen(false);
  }

  function deleteProblem(id: string) {
    setProblems(problems.filter(p => p.id !== id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Problems</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Track Problems
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Track Solved Problems</DialogTitle>
              <DialogDescription>
                Log the number of problems you've solved.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Problems</FormLabel>
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
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any specific topics or difficulties?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Track Problems</Button>
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
              <TableHead>Subject</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length > 0 ? (
              [...problems].reverse().map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>{problem.date}</TableCell>
                  <TableCell className="font-medium">{problem.subject}</TableCell>
                  <TableCell>{problem.count}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{problem.notes}</TableCell>
                   <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteProblem(problem.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No problems tracked yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
