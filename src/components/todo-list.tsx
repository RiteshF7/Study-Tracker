
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Todo } from '@/lib/types';
import { PlusCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';

const todoSchema = z.object({
  title: z.string().min(1, 'To-do title cannot be empty.'),
  dueDate: z.date().optional(),
});

export function TodoList() {
  const { user } = useFirebase();

  const todosQuery = useMemoFirebase((firestore) => {
    if (!user) return null;
    const todosCollection = collection(firestore, 'users', user.uid, 'todos');
    return query(todosCollection, orderBy("createdAt", "desc"));
  }, [user]);


  const { data: todos, isLoading } = useCollection<Todo>(todosQuery);

  const form = useForm<z.infer<typeof todoSchema>>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = (values: z.infer<typeof todoSchema>) => {
    const { firestore, user } = useFirebase();
    if (!firestore || !user) return;
    const todosCollection = collection(firestore, 'users', user.uid, 'todos');


    const newTodo: Omit<Todo, 'id' | 'createdAt'> & { createdAt: any, dueDate?: string } = {
      title: values.title,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      ...(values.dueDate && { dueDate: format(values.dueDate, 'yyyy-MM-dd') }),
    };
    addDocumentNonBlocking(todosCollection, newTodo);
    form.reset();
  };

  const toggleTodo = (todo: Todo) => {
    const { firestore, user } = useFirebase();
    if (!user || !firestore || !todo.id) return;
    const docRef = doc(firestore, 'users', user.uid, 'todos', todo.id);
    setDocumentNonBlocking(docRef, { completed: !todo.completed }, { merge: true });
  };
  
  const deleteTodo = (id: string) => {
    const { firestore, user } = useFirebase();
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'todos', id);
    deleteDocumentNonBlocking(docRef);
  };

  const groupedTodos = useMemo(() => {
    if (!todos) return {};
    
    const groups: { [key: string]: Todo[] } = {
        'Overdue': [],
        'Today': [],
        'Tomorrow': [],
        'Upcoming': [],
        'Someday': [],
    };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const sorted = [...todos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000); // Far future
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
      return dateA.getTime() - dateB.getTime();
    });

    sorted.forEach(todo => {
        if (todo.completed) return; // Don't show completed in main lists
        
        if (!todo.dueDate) {
            groups['Someday'].push(todo);
            return;
        }

        const dueDate = new Date(todo.dueDate);
        dueDate.setHours(0,0,0,0); // Normalize date

        if (dueDate < today) {
            groups['Overdue'].push(todo);
        } else if (isToday(dueDate)) {
            groups['Today'].push(todo);
        } else if (isTomorrow(dueDate)) {
            groups['Tomorrow'].push(todo);
        } else {
            groups['Upcoming'].push(todo);
        }
    });

    return groups;
  }, [todos]);

  const completedTodos = useMemo(() => todos?.filter(t => t.completed) || [], [todos]);

  const renderTodoList = (todoList: Todo[]) => {
    return todoList.map((todo) => (
      <div key={todo.id} className="flex items-center gap-4 p-2 -ml-2 rounded-md transition-colors hover:bg-muted/50">
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
        {todo.dueDate && (
             <span className="text-xs text-muted-foreground">{format(new Date(todo.dueDate), 'MMM d')}</span>
        )}
        <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id!)}>
          <Trash2 className="h-4 w-4 text-destructive/50 hover:text-destructive" />
        </Button>
      </div>
    ));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
        <CardDescription>Organize your tasks and stay on track.</CardDescription>
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
                    <Input placeholder="e.g., Prepare work report..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                   <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[150px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMM d")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setDate(new Date().getDate() -1))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </form>
        </Form>
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading to-dos...</p>
          ) : (
            <>
              {Object.entries(groupedTodos).map(([group, list]) => (
                list.length > 0 && (
                  <div key={group}>
                    <h3 className="font-semibold text-md mb-2 flex items-center">
                        {group}
                        <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted/80 rounded-full px-2 py-0.5">{list.length}</span>
                    </h3>
                    <div className="space-y-1">{renderTodoList(list)}</div>
                  </div>
                )
              ))}
              {completedTodos.length > 0 && (
                 <div>
                    <h3 className="font-semibold text-md mb-2 flex items-center">
                        Completed
                        <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted/80 rounded-full px-2 py-0.5">{completedTodos.length}</span>
                    </h3>
                    <div className="space-y-1 opacity-60">
                        {renderTodoList(completedTodos)}
                    </div>
                </div>
              )}
            </>
          )}

          {!isLoading && !todos?.length && (
             <p className="text-muted-foreground text-center py-8">No to-do items yet. Add one above!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
