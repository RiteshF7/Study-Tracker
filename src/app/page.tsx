'use client';

import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpenCheck, BarChart3, BrainCircuit, CalendarClock } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Card, CardContent } from '@/components/ui/card';

const features = [
    {
        icon: <BarChart3 className="w-8 h-8 text-primary" />,
        title: "Track Everything",
        description: "Log study sessions, classes, and breaks to get a clear picture of your academic life.",
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-primary" />,
        title: "AI-Powered Scheduler",
        description: "Let our intelligent assistant create an optimized study schedule based on your habits.",
    },
    {
        icon: <CalendarClock className="w-8 h-8 text-primary" />,
        title: "Plan Your Success",
        description: "Organize your tasks with an integrated to-do list and calendar view.",
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
    <div className="flex flex-col min-h-screen bg-background">
        <header className="px-4 lg:px-6 h-14 flex items-center">
            <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                <BookOpenCheck className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg font-headline">StudyTrack</span>
            </Link>
        </header>
        <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                        <div className="flex flex-col justify-center space-y-4">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                                    Your Intelligent Journal for Academic Excellence
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                    StudyTrack helps you monitor your study habits, optimize your schedule with AI, and stay organized to achieve your goals.
                                </p>
                            </div>
                            <div className="w-full max-w-sm space-y-2">
                                <Button onClick={handleGoogleSignIn} size="lg" className="w-full" disabled={isUserLoading}>
                                    <FcGoogle className="mr-2 h-5 w-5" /> Sign in with Google
                                </Button>
                            </div>
                        </div>
                         <div className="hidden lg:flex items-center justify-center">
                            <img
                                src="https://picsum.photos/seed/landing/600/400"
                                width="600"
                                height="400"
                                alt="Hero"
                                data-ai-hint="study analytics dashboard"
                                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                            />
                        </div>
                    </div>
                </div>
            </section>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                From activity tracking to AI-powered recommendations, StudyTrack provides the tools to enhance your learning journey.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
                        {features.map((feature, index) => (
                            <Card key={index} className="p-6">
                                 <CardContent className="p-0 flex flex-col items-center text-center gap-4">
                                    {feature.icon}
                                    <div className="grid gap-1">
                                        <h3 className="text-lg font-bold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                 </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </main>
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">&copy; 2024 StudyTrack. All rights reserved.</p>
        </footer>
    </div>
  );
}

// Add a Link import for the header link
import Link from 'next/link';
