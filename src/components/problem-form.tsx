
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator } from "./ui/select";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Trash2 } from "lucide-react";

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
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [problemCategories, setProblemCategories] = useLocalStorage<string[]>(
    "custom-problem-categories",
    []
  );

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

  const handleAddNewCategory = () => {
    if (newCategory.trim() && !problemCategories.includes(newCategory.trim())) {
      const category = newCategory.trim();
      setProblemCategories([...problemCategories, category]);
      form.setValue('category', category);
      setIsAddCategoryOpen(false);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setProblemCategories(problemCategories.filter(cat => cat !== categoryToRemove));
    if (form.getValues('category') === categoryToRemove) {
      form.setValue('category', '');
    }
  };


  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Select
                  onValueChange={(value) => {
                    if (value === "add_new") setIsAddCategoryOpen(true);
                    else if (value === "manage") setIsManageCategoriesOpen(true);
                    else field.onChange(value);
                  }}
                  value={field.value}
                >
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {problemCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="add_new">Add New...</SelectItem>
                        <SelectItem value="manage" className="text-muted-foreground">Manage Categories...</SelectItem>
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
        <div className="flex justify-end pt-4">
          <Button type="submit">Track Problems</Button>
        </div>
      </form>
    </Form>

    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
            <div className="py-4">
                <Input
                    placeholder="e.g., Organic Chemistry"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
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
