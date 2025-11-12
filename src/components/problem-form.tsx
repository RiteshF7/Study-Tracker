
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
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
import { defaultProblemCategories } from "@/lib/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

const problemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  count: z.coerce.number().min(1, "Count must be at least 1"),
  notes: z.string().optional(),
});

interface ProblemFormProps {
  onFormSubmit?: () => void;
}

export function ProblemForm({ onFormSubmit }: ProblemFormProps) {
  const { firestore, user } = useFirebase();

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      name: "",
      category: "",
      count: 1,
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof problemSchema>) {
    if (!user || !firestore) return;
    const problemsCollection = collection(firestore, "users", user.uid, "problems");
    
    const newProblem: Omit<Problem, "id" | "createdAt"> & { createdAt: any } = {
      name: values.name,
      category: values.category,
      count: values.count,
      notes: values.notes || "",
      date: new Date().toISOString().split("T")[0],
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(problemsCollection, newProblem);
    
    form.reset();
    if (onFormSubmit) onFormSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name / Topic</FormLabel>
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {defaultProblemCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
                <FormLabel>Number Solved</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                <Textarea placeholder="e.g., Struggled with step 2, review tomorrow." {...field} />
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
  );
}
