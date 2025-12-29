
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sparkles } from "lucide-react";

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
  const [course, setCourse] = useLocalStorage('selected-course', 'JEE');
  const [year, setYear] = useLocalStorage('selected-year', '11th');
  const [isAnimationsEnabled, setIsAnimationsEnabled] = useLocalStorage('st-animations-enabled', 'true');


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
            <FormItem>
              <FormLabel>Course Focus</FormLabel>
              <div className="flex gap-4">
                <Select onValueChange={(val) => {
                  setCourse(val);
                  // Reset year when course changes to avoid invalid states
                  setYear(val === 'BPT' ? '1st Year' : '11th');
                }} value={course}>
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="BPT">BPT</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={setYear} value={year}>
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {course === 'BPT' ? (
                      <>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="5th Year">5th Year</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="11th">11th</SelectItem>
                        <SelectItem value="12th">12th</SelectItem>
                        <SelectItem value="Dropper">Dropper</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <FormDescription>
                Select your course and current year/class to customize the syllabus.
              </FormDescription>
            </FormItem>
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
                  <FormLabel>Target Study Hours</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your total study goal for the year.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t">
               <h3 className="text-lg font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  App Preferences
               </h3>
               <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Click Animations</FormLabel>
                    <FormDescription>
                      Enable particle effects when clicking.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={isAnimationsEnabled === 'true'}
                      onCheckedChange={(checked) => setIsAnimationsEnabled(checked ? 'true' : 'false')}
                    />
                  </FormControl>
                </div>
            </div>
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
