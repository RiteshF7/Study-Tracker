
'use client';

import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpenCheck, BarChart3, BrainCircuit, CalendarClock, ListTodo } from 'lucide-react';
import { TrafficLight } from '@/components/icons/traffic-light';
import { FcGoogle } from 'react-icons/fc';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { FeatureCarousel } from '@/components/feature-carousel';

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
    },
    {
        icon: <BarChart3 className="w-8 h-8 text-primary" />,
        title: 'Progress Analytics',
        description: 'Visualize your study data with insightful charts and graphs to track your progress over time.',
    },
    {
        icon: <CalendarClock className="w-8 h-8 text-primary" />,
        title: 'Deadline Tracking',
        description: 'Never miss a deadline again with our integrated calendar and to-do list functionality.',
    }
];

export default function LandingPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/home');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCarouselOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = () => {
    if (auth) {
        initiateGoogleSignIn(auth);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <FeatureCarousel open={isCarouselOpen} onOpenChange={setIsCarouselOpen} />
        <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
            <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                <BookOpenCheck className="h-7 w-7 text-primary" />
                <span className="font-bold text-2xl font-headline">StudyTrack</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <Button variant="ghost" onClick={() => setIsCarouselOpen(true)}>Features</Button>
                <Button variant="ghost">Pricing</Button>
                <Button variant="ghost">Contact</Button>
            </nav>
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
                                <Button onClick={handleGoogleSignIn} size="lg" variant="outline" className="w-full text-lg py-6 border-2 border-border hover:bg-primary/10 hover:border-primary" disabled={isUserLoading}>
                                    <FcGoogle className="mr-3 h-6 w-6" /> Get Started with Google
                                </Button>
                                 <p className="text-xs text-muted-foreground mt-2 text-center">Free to use, sign up in seconds.</p>
                            </div>
                        </div>
                         <div className="hidden lg:flex items-center justify-center">
                            <img
                                src="https://picsum.photos/seed/hero-image-main/600/500"
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
                            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6 text-center">
                                    <div className="flex justify-center items-center mb-4">
                                      <div className="bg-primary/10 p-4 rounded-full">
                                        {feature.icon}
                                      </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
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
                  <Button variant='link' className='text-xs'>
                    Pricing
                  </Button>
                  <Button variant='link' className='text-xs'>
                    Contact
                  </Button>
              </nav>
          </div>
        </footer>
    </div>
  );
}
