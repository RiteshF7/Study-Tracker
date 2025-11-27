
'use client';

import { initiateGoogleSignIn, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookOpenCheck, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "Is StudyTrack free to use?",
        answer: "Yes, StudyTrack is completely free for students. You can sign in with Google or try it as a guest to access all features without any cost."
    },
    {
        question: "Can I use it offline?",
        answer: "Currently, StudyTrack requires an internet connection to sync your data securely to the cloud and provide AI-powered features."
    },
    {
        question: "How does the AI Planner work?",
        answer: "Our AI analyzes your study habits, available time, and subject confidence levels to suggest an optimized schedule that maximizes your productivity and helps you reach your academic goals."
    },
    {
        question: "Is my data private?",
        answer: "Absolutely. We prioritize your privacy and only use your data to provide the features you use. We do not sell your personal information to third parties."
    }
];

export default function LandingPage() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/home');
        }
    }, [user, isUserLoading, router]);

    const handleGoogleSignIn = async () => {
        if (auth) {
            try {
                setIsSigningIn(true);
                await initiateGoogleSignIn(auth);
            } catch (error: any) {
                if (error.code !== 'auth/popup-closed-by-user') {
                    toast({
                        variant: "destructive",
                        title: "Sign In Error",
                        description: error.message || "An error occurred during sign in.",
                    });
                }
            } finally {
                setIsSigningIn(false);
            }
        }
    };

    const handleAnonymousSignIn = async () => {
        if (auth) {
            try {
                setIsSigningIn(true);
                await initiateAnonymousSignIn(auth);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Sign In Error",
                    description: error.message || "An error occurred during guest sign in.",
                });
            } finally {
                setIsSigningIn(false);
            }
        }
    };

    const scrollToFaqs = () => {
        const element = document.getElementById('faqs');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
                <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                    <BookOpenCheck className="h-7 w-7 text-primary" />
                    <span className="font-bold text-2xl font-headline">StudyTrack</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Button variant="ghost" onClick={scrollToFaqs}>FAQs</Button>
                    <Button variant="ghost">Pricing</Button>
                    <Button variant="ghost">Contact</Button>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-muted/30">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-8 lg:grid-cols-1 lg:gap-16 items-center text-center">
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="space-y-4">
                                    <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
                                        Your All-in-One Study Companion
                                    </div>
                                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none font-headline">
                                        Achieve Academic Excellence
                                    </h1>
                                    <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                                        StudyTrack helps you monitor habits, optimize your schedule with AI, and organize your learning to hit your goals.
                                    </p>
                                </div>
                                <div className="w-full max-w-sm space-y-2">
                                    <Button onClick={handleGoogleSignIn} size="lg" variant="outline" className="w-full text-lg py-6 border-2 border-border hover:bg-primary/10 hover:border-primary" disabled={isUserLoading || isSigningIn}>
                                        <FcGoogle className="mr-3 h-6 w-6" /> Get Started with Google
                                    </Button>
                                    <Button onClick={handleAnonymousSignIn} size="lg" variant="secondary" className="w-full text-lg py-6" disabled={isUserLoading || isSigningIn}>
                                        <User className="mr-3 h-6 w-6" /> Try as Guest
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">Free to use, sign up in seconds.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="faqs" className="w-full py-20 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Frequently Asked Questions</h2>
                                <p className="max-w-[900px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                                    Got questions? We've got answers.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto max-w-3xl">
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger className="text-left text-lg font-semibold">{faq.question}</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground text-base">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="bg-muted/40 border-t">
                <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
                    <p className="text-xs text-muted-foreground">&copy; 2024 StudyTrack. All rights reserved.</p>
                    <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                        <Button variant='link' asChild className="text-xs hover:underline underline-offset-4">
                            <Link href="#faqs" prefetch={false}>
                                FAQs
                            </Link>
                        </Button>
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
