
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Problem, ProblemCategory } from "@/lib/types";
import { defaultProblemCategories } from "@/lib/types";
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
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const problemSchema = z.object({
  name: z.string().min(1, "Name/Topic is required."),
  category: z.string().min(1, "Category is required."),
  count: z.coerce.number().min(1, "Must solve at least 1 problem."),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export function ProblemTracker() {
  const [open, setOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<ProblemCategory[]>(defaultProblemCategories);
  const { firestore, user } = useFirebase();

  const problemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const problemsCollection = collection(firestore, "users", user.uid, "problems");
    return query(problemsCollection, orderBy("createdAt", "desc"));
  },[firestore, user]);

  const { data: problems, isLoading } = useCollection<Problem>(problemsQuery);

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      name: "",
      category: "",
      count: 10,
      notes: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        category: "",
        count: 10,
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [form, open]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const newCat = { id: newCategory.toLowerCase().replace(/\s/g, '-'), name: newCategory.trim() };
      setCategories([...categories, newCat]);
      form.setValue('category', newCat.name);
      setIsAddCategoryOpen(false);
      setNewCategory('');
    }
  };

  function onSubmit(values: z.infer<typeof problemSchema>) {
    if (!problemsQuery || !user) return;
    const newProblem: Omit<Problem, 'id' | 'createdAt'> & { createdAt: any } = {
      ...values,
      notes: values.notes || "",
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(problemsQuery.converter ? problemsQuery.withConverter(null) : problemsQuery, newProblem);
    setOpen(false);
  }

  function deleteProblem(id: string) {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "problems", id);
    deleteDocumentNonBlocking(docRef);
  }

  return (
    <>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name / Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Kinematics Equations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (value === "add_new") {
                              setIsAddCategoryOpen(true);
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
                <TableHead>Name / Topic</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading problems...
                  </TableCell>
                </TableRow>
              ) : problems && problems.length > 0 ? (
                problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell>{problem.date}</TableCell>
                    <TableCell className="font-medium">{problem.name}</TableCell>
                    <TableCell>{problem.category}</TableCell>
                    <TableCell>{problem.count}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{problem.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteProblem(problem.id!)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No problems tracked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Organic Chemistry"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
