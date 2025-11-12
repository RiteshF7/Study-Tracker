
"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { Problem } from "@/lib/types";

const problemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  count: z.coerce.number().min(1, "Count must be at least 1."),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  category: z.string().optional(),
});

interface ProblemFormProps {
  triggerButton: React.ReactNode;
  onFormSubmit?: () => void;
}

export function ProblemForm({ triggerButton, onFormSubmit }: ProblemFormProps) {
  const [open, setOpen] = useState(false);
  const { firestore, user } = useFirebase();

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      name: "",
      count: 1,
      notes: "",
      date: new Date().toISOString().split("T")[0],
      category: "General",
    },
  });

  const onSubmit = (values: z.infer<typeof problemSchema>) => {
    if (!user) return;
    const problemsCollection = collection(firestore, "users", user.uid, "problems");
    
    const newProblem: Omit<Problem, 'id' | 'createdAt'> & { createdAt: any } = {
      ...values,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(problemsCollection, newProblem);
    
    setOpen(false);
    if (onFormSubmit) {
      onFormSubmit();
    }
    form.reset();
  };
  
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem/Topic Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Integration by Parts" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Count</FormLabel>
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
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any thoughts or key takeaways?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Log Problems</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  // If it's part of a larger dialog, render form directly
  if (!triggerButton) {
    return (
        <div className="p-1">
            <DialogHeader>
                <DialogTitle>Track Problems</DialogTitle>
                <DialogDescription>
                    Log any problems or questions you worked on.
                </DialogDescription>
            </DialogHeader>
            {formContent}
        </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Track Problems Solved</DialogTitle>
            <DialogDescription>
                Log the number of practice problems you've completed.
            </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
