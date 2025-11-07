"use client";

import { useActionState, useFormStatus } from "react-dom";
import { getScheduleRecommendation, SchedulerState } from "@/lib/actions";
import type { Activity, Problem } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

const initialState: SchedulerState = {
  recommendation: null,
  error: null,
};

function SubmitButton() {
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
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Schedule
        </>
      )}
    </Button>
  );
}

export function AiScheduler() {
  const { firestore, user } = useFirebase();

  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const problemsCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "problems") : null
  , [firestore, user]);

  const { data: activities } = useCollection<Activity>(activitiesCollection);
  const { data: problems } = useCollection<Problem>(problemsCollection);

  const [state, formAction] = useActionState(getScheduleRecommendation, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
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
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      <div className="space-y-6">
        {state.recommendation ? (
          <>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Your Recommended Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{state.recommendation.scheduleRecommendation}</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/5">
              <CardHeader>
                <CardTitle>Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{state.recommendation.reasoning}</p>
              </CardContent>
            </Card>
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
