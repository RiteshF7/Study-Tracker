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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { courses, CourseName } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email().optional(),
  learningGoals: z.string().optional(),
  course: z.string().optional(),
});

type UserProfile = {
    name?: string;
    learningGoals?: string;
    course?: CourseName;
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
      email: "",
      learningGoals: "",
      course: "General Studies",
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({ 
          name: userProfile?.name || user.displayName || "",
          email: user.email || "",
          learningGoals: userProfile?.learningGoals || "",
          course: userProfile?.course || "General Studies",
      });
    }
  }, [user, userProfile, form]);


  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef) {
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
        course: values.course,
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Your email address cannot be changed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your course of study" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(courses).map((courseName) => (
                        <SelectItem key={courseName} value={courseName}>{courseName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <FormDescription>
                    This will tailor the subjects available in the app.
                  </FormDescription>
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
