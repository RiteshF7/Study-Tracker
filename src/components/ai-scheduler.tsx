"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getScheduleRecommendation, refineScheduleAction, SchedulerState } from "@/lib/actions";
import type { Activity, Problem } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Sparkles } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";

const initialState: SchedulerState = {
  recommendation: null,
  error: null,
};

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

export function AiScheduler() {
  const { firestore, user } = useFirebase();
  const editFormRef = useRef<HTMLFormElement>(null);

  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const problemsCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "problems") : null
  , [firestore, user]);

  const { data: activities } = useCollection<Activity>(activitiesCollection);
  const { data: problems } = useCollection<Problem>(problemsCollection);

  const [state, formAction] = useActionState(getScheduleRecommendation, initialState);
  const [editState, editFormAction] = useActionState(refineScheduleAction, state);
  
  const { toast } = useToast();

  const finalState = state.recommendation ? editState : state;

  useEffect(() => {
    if (finalState.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: finalState.error,
      });
    }
  }, [finalState.error, toast]);
  
  useEffect(() => {
    // If the main form generates a new schedule, apply it to the edit state
    // and reset the edit form's input.
    if(state.recommendation) {
        editState.recommendation = state.recommendation;
        if (editFormRef.current) {
            editFormRef.current.reset();
        }
    }
  }, [state.recommendation, editState]);

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
          <form action={formAction}>
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
        
        {finalState.recommendation && (
            <Card>
            <CardHeader>
                <CardTitle>Refine Schedule</CardTitle>
                <CardDescription>
                    Provide instructions to modify the schedule above.
                </CardDescription>
            </CardHeader>
            <form action={editFormAction} ref={editFormRef}>
                <CardContent className="space-y-4">
                     <input type="hidden" name="currentSchedule" value={JSON.stringify(finalState.recommendation.scheduleRecommendation)} />
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
        {finalState.recommendation ? (
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
                  {finalState.recommendation.scheduleRecommendation.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.time}</TableCell>
                      <TableCell>{item.activity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
