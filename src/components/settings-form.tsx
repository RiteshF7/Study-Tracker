
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
});

type UserProfile = {
    name?: string;
    learningGoals?: string;
}

export function SettingsForm() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => 
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      learningGoals: "",
    },
  });

  useEffect(() => {
    if (user && userProfile) {
      form.reset({ 
          name: userProfile?.name || user.displayName || "",
          learningGoals: userProfile?.learningGoals || "",
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
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="e.g., 'Ace my upcoming board exams' or 'Publish my first research paper.'" 
                        {...field}
                        rows={4}
                    />
                  </FormControl>
                   <FormDescription>
                    The goal you mention will be represented on your home screen just to keep you reminded.
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
