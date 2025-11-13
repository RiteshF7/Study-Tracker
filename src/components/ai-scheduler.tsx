
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getScheduleRecommendation, refineScheduleAction, addScheduleToTodos, SchedulerState, AddToTodoState } from "@/lib/actions";
import type { Activity, Problem } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Sparkles, PlusCircle } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";

const initialSchedulerState: SchedulerState = {
  recommendation: null,
  error: null,
};

const initialTodoState: AddToTodoState = {
    error: null,
    message: null,
}

function SubmitButton({ text, icon: Icon }: { text: string; icon: React.ElementType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Icon className="mr-2 h-4 w-4" />
          {text}
        </>
      )}
    </Button>
  );
}

function AddToTodoButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="outline" size="sm">
             {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                </>
            ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add to To-Do List
                </>
            )}
        </Button>
    )
}

export function AiScheduler() {
  const { user } = useFirebase();
  const editFormRef = useRef<HTMLFormElement>(null);
  const addToTodoFormRef = useRef<HTMLFormElement>(null);

  const activitiesQuery = useMemoFirebase((firestore) => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [user]);

  const problemsQuery = useMemoFirebase((firestore) =>
    user ? collection(firestore, "users", user.uid, "problems") : null
  , [user]);

  const { data: activities } = useCollection<Activity>(activitiesQuery);
  const { data: problems } = useCollection<Problem>(problemsQuery);

  const [generateState, generateFormAction] = useActionState(getScheduleRecommendation, initialSchedulerState);
  const [editState, editFormAction] = useActionState(refineScheduleAction, initialSchedulerState);
  const [addToTodoState, addToTodoAction] = useActionState(addScheduleToTodos, initialTodoState);
  
  const [currentSchedule, setCurrentSchedule] = useState<SchedulerState['recommendation']>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (generateState.error) {
      toast({
        variant: "destructive",
        title: "Error Generating Schedule",
        description: generateState.error,
      });
    }
    if (generateState.recommendation) {
        setCurrentSchedule(generateState.recommendation);
        if (editFormRef.current) {
            editFormRef.current.reset();
        }
    }
  }, [generateState, toast]);

  useEffect(() => {
    if (editState.error) {
      toast({
        variant: "destructive",
        title: "Error Refining Schedule",
        description: editState.error,
      });
    }
    if (editState.recommendation) {
        setCurrentSchedule(editState.recommendation);
    }
  }, [editState, toast]);

  useEffect(() => {
    if (addToTodoState.error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: addToTodoState.error,
        });
    }
    if (addToTodoState.message) {
        toast({
            title: "Success!",
            description: addToTodoState.message,
        });
    }
  }, [addToTodoState, toast]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Intelligent Scheduler</CardTitle>
            <CardDescription>
              Let AI create an optimized study schedule for you based on your activity history and preferences.
            </CardDescription>
          </CardHeader>
          <form action={generateFormAction}>
            <CardContent className="space-y-4">
              <input type="hidden" name="activities" value={JSON.stringify(activities || [])} />
              <input type="hidden" name="problems" value={JSON.stringify(problems || [])} />
              <div className="space-y-2">
                <Label htmlFor="preferredStudyTimes">Preferred Study Times & Constraints</Label>
                <Textarea
                  id="preferredStudyTimes"
                  name="preferredStudyTimes"
                  placeholder="e.g., I prefer studying in the morning from 9 AM to 12 PM. I have classes on Mondays and Wednesdays from 2 PM to 4 PM. I want to take a break on Friday evenings."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton text="Generate Schedule" icon={Wand2} />
            </CardFooter>
          </form>
        </Card>
        
        {currentSchedule && (
            <Card>
            <CardHeader>
                <CardTitle>Refine Schedule</CardTitle>
                <CardDescription>
                    Provide instructions to modify the schedule above.
                </CardDescription>
            </CardHeader>
            <form action={editFormAction} ref={editFormRef}>
                <CardContent className="space-y-4">
                     <input type="hidden" name="currentSchedule" value={JSON.stringify(currentSchedule.scheduleRecommendation)} />
                    <div className="space-y-2">
                        <Label htmlFor="editInstruction">Edit Instructions</Label>
                        <Input
                            id="editInstruction"
                            name="editInstruction"
                            placeholder="e.g., Change the 9am session to be about Physics"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton text="Refine Schedule" icon={Sparkles} />
                </CardFooter>
            </form>
            </Card>
        )}

      </div>
      
      <div className="space-y-6 sticky top-4">
        {currentSchedule ? (
          <>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Your Recommended Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead>Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSchedule.scheduleRecommendation.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.time}</TableCell>
                        <TableCell>{item.activity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <form action={addToTodoAction} ref={addToTodoFormRef}>
                    <input type="hidden" name="schedule" value={JSON.stringify(currentSchedule.scheduleRecommendation)} />
                    <input type="hidden" name="userId" value={user?.uid} />
                    <AddToTodoButton />
                </form>
              </CardFooter>
            </Card>
            {currentSchedule.reasoning && (
              <Card>
                <CardHeader>
                  <CardTitle>Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Principle</TableHead>
                        <TableHead>Explanation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSchedule.reasoning.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.point}</TableCell>
                          <TableCell>{item.explanation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-muted-foreground">
              <Wand2 className="mx-auto h-12 w-12 mb-4" />
              <p>Your AI-generated schedule will appear here.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
