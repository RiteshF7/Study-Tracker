
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDoc, useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useEffect } from "react";
import { Textarea } from "./ui/textarea";

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  learningGoals: z.string().optional(),
  targetHours: z.coerce.number().positive().optional(),
});

type UserProfile = {
    name?: string;
    learningGoals?: string;
    targetHours?: number;
}

export function SettingsForm() {
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase((firestore) => 
    user ? doc(firestore, "users", user.uid) : null
  , [user]);
  
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      learningGoals: "",
      targetHours: 150,
    },
  });

  useEffect(() => {
    if (user && userProfile) {
      form.reset({ 
          name: userProfile?.name || user.displayName || "",
          learningGoals: userProfile?.learningGoals || "",
          targetHours: userProfile?.targetHours || 150,
      });
    }
  }, [user, userProfile, form]);


  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to update your profile.",
        });
        return;
    }
    
    setDocumentNonBlocking(userDocRef, { 
        name: values.name,
        learningGoals: values.learningGoals,
        targetHours: values.targetHours,
        email: user.email,
        id: user.uid,
    }, { merge: true });

    toast({
      title: "Profile Updated",
      description: "Your settings have been successfully updated.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          This is your personal information and learning preferences.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="learningGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Motivation</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="e.g., 'Focus on the process, not just the outcome'" 
                        {...field}
                        rows={2}
                    />
                  </FormControl>
                   <FormDescription>
                    A motivational quote that will appear on your dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="targetHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Hours</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 150" {...field} />
                  </FormControl>
                   <FormDescription>
                    Set a target number of hours for your progress tracking.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
