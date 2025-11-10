
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { Todo } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";


const todoSchema = z.object({
  title: z.string().min(1, 'To-do title cannot be empty.'),
});

export function TodoList() {
  const { firestore, user } = useFirebase();

  const todosCollection = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'todos') : null
  , [firestore, user]);

  const { data: todos, isLoading } = useCollection<Todo>(todosCollection);

  const form = useForm<z.infer<typeof todoSchema>>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = (values: z.infer<typeof todoSchema>) => {
    if (!todosCollection || !user) return;

    const newTodo: Omit<Todo, 'id' | 'createdAt'> & { createdAt: any } = {
      title: values.title,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(todosCollection, newTodo);
    form.reset();
  };

  const toggleTodo = (todo: Todo) => {
    if (!todosCollection || !todo.id) return;
    const docRef = doc(todosCollection, todo.id);
    setDocumentNonBlocking(docRef, { completed: !todo.completed }, { merge: true });
  };
  
  const deleteTodo = (id: string) => {
    if (!todosCollection) return;
    const docRef = doc(todosCollection, id);
    deleteDocumentNonBlocking(docRef);
  };

  const sortedTodos = todos?.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const timeA = a.createdAt?.toDate?.().getTime() || 0;
    const timeB = b.createdAt?.toDate?.().getTime() || 0;
    return timeA - timeB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2 mb-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Add a new to-do..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </form>
        </Form>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading to-dos...</p>
          ) : sortedTodos && sortedTodos.length > 0 ? (
            sortedTodos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-4 p-2 rounded-md transition-colors hover:bg-muted/50">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo)}
                  aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={cn(
                    'flex-1 text-sm font-medium cursor-pointer',
                    todo.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {todo.title}
                </label>
                <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id!)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">No to-do items yet. Add one above!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
