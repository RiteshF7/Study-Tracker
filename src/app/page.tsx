
'use client';

import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpenCheck, BrainCircuit, ListTodo } from 'lucide-react';
import { TrafficLight } from '@/components/icons/traffic-light';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';

const features = [
    {
        icon: <ListTodo className="w-8 h-8 text-primary" />,
        title: "Activity Tracking",
        description: "Log study sessions, classes, and breaks to get a clear picture of your academic life.",
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-primary" />,
        title: "AI-Powered Planner",
        description: "Let our intelligent assistant create an optimized study schedule based on your habits.",
    },
    {
        icon: <TrafficLight className="w-8 h-8 text-primary" />,
        title: "Subject Sorting",
        description: "Categorize subjects by confidence level to focus your efforts where they're needed most.",
    }
];

export default function LandingPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/home');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = () => {
    if (auth) {
        initiateGoogleSignIn(auth);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
            <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                <BookOpenCheck className="h-7 w-7 text-primary" />
                <span className="font-bold text-2xl font-headline">StudyTrack</span>
            </Link>
        </header>
        <main className="flex-1">
            <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
                        <div className="flex flex-col justify-center space-y-6">
                            <div className="space-y-4">
                                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
                                    Your All-in-One Study Companion
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none font-headline">
                                    Achieve Academic Excellence
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                    StudyTrack helps you monitor habits, optimize your schedule with AI, and organize your learning to hit your goals.
                                </p>
                            </div>
                            <div className="w-full max-w-sm">
                                <Button onClick={handleGoogleSignIn} size="lg" className="w-full text-lg py-6" disabled={isUserLoading}>
                                    <FcGoogle className="mr-3 h-6 w-6" /> Get Started with Google
                                </Button>
                                 <p className="text-xs text-muted-foreground mt-2 text-center">Free to use, sign up in seconds.</p>
                            </div>
                        </div>
                         <div className="hidden lg:flex items-center justify-center">
                            <img
                                src="https://picsum.photos/seed/landing-hero/600/500"
                                width="600"
                                height="500"
                                alt="Student studying with charts"
                                data-ai-hint="study analytics dashboard"
                                className="mx-auto aspect-[6/5] overflow-hidden rounded-xl object-cover shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>
            <section id="features" className="w-full py-20 md:py-24 lg:py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Everything You Need to Succeed</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                                From activity tracking to AI-powered recommendations, StudyTrack provides the tools to enhance your learning journey.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="grid gap-4 text-center">
                                <div className="flex justify-center items-center">
                                  <div className="bg-primary/10 p-4 rounded-full">
                                    {feature.icon}
                                  </div>
                                </div>
                                <div className="grid gap-1">
                                    <h3 className="text-xl font-bold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
        <footer className="bg-muted/40 border-t">
          <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
              <p className="text-xs text-muted-foreground">&copy; 2024 StudyTrack. All rights reserved.</p>
              <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                  <Link href="#features" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                      Features
                  </Link>
              </nav>
          </div>
        </footer>
    </div>
  );
}
