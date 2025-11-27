
'use client';

import { initiateGoogleSignIn, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookOpenCheck, User, Mail, Check, Lock } from 'lucide-react';
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
        question: "Can I use it on my phone?",
        answer: "Absolutely! StudyTrack is fully responsive and optimized for mobile browsers, so you can track your progress and manage your schedule on the go."
    },
    {
        question: "What happens if I miss a scheduled study session?",
        answer: "No stress. Our AI Planner detects missed tasks and intelligently suggests a rescheduled plan to keep you on track without the guilt."
    },
    {
        question: "How does the AI Planner work?",
        answer: "Our AI analyzes your study habits, available time, and subject confidence levels to suggest an optimized schedule that maximizes your productivity."
    },
    {
        question: "Is my data private?",
        answer: "Your privacy is our priority. Your journal entries and personal data are encrypted and stored securely. We do not sell your information."
    },
    {
        question: "Can I use it offline?",
        answer: "Currently, StudyTrack requires an internet connection to sync your data securely to the cloud and provide AI-powered features."
    }
];

const capabilities = [
    {
        title: "Magical Diary",
        subtitle: "Reflect & Release",
        description: "A private sanctuary to declutter your mind. Capture thoughts in a distraction-free environment to boost mental clarity.",
        delay: false
    },
    {
        title: "Dynamic Planner",
        subtitle: "Fluid Scheduling",
        description: "Life happens. Your schedule adapts automatically to your changing day, ensuring you never fall behind.",
        delay: true
    },
    {
        title: "Smart Sorting",
        subtitle: "Targeted Focus",
        description: "Stop guessing what to study. Instantly identify and attack your weakest subjects with confidence-based sorting.",
        delay: false
    },
    {
        title: "Visual Analytics",
        subtitle: "See the Win",
        description: "Turn effort into visible progress. Insightful graphs and streaks keep you motivated to push further.",
        delay: true
    }
];

const pricingPackages = [
    {
        title: "Student Starter",
        price: "Free",
        description: "Essential tools for every student.",
        features: ["Activity Tracking", "Basic Analytics", "3 Subjects"]
    },
    {
        title: "Scholar Plus",
        price: "$4.99",
        description: "Advanced AI limits and custom themes.",
        features: ["Unlimited Subjects", "AI Planner (Basic)", "Dark Mode"]
    },
    {
        title: "Academic Pro",
        price: "$9.99",
        description: "Unlimited AI, detailed analytics, and priority support.",
        features: ["Advanced AI Planner", "Full Analytics", "Priority Support"]
    },
    {
        title: "Study Group",
        price: "$19.99",
        description: "Collaborative features for up to 5 students.",
        features: ["Shared Schedules", "Group Chat", "File Sharing"]
    },
    {
        title: "Institution",
        price: "Custom",
        description: "Admin dashboard and bulk management for schools.",
        features: ["Admin Dashboard", "Bulk User Mgmt", "SSO"]
    },
    {
        title: "Lifetime Learner",
        price: "$199",
        description: "Pay once, own it forever. All Pro features included.",
        features: ["Lifetime Access", "All Pro Features", "Early Access"]
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

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                    <BookOpenCheck className="h-7 w-7 text-primary" />
                    <span className="font-bold text-2xl font-headline">StudyTrack</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Button variant="ghost" onClick={() => scrollToSection('faqs')}>FAQs</Button>
                    <Button variant="ghost" onClick={() => scrollToSection('pricing')}>Pricing</Button>
                    <Button variant="ghost" onClick={() => scrollToSection('contact')}>Contact</Button>
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

                <section className="w-full py-20 bg-background overflow-hidden">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline mb-4">Unlock Your Potential</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Powerful tools designed to elevate your study game.
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
                            {capabilities.map((cap, index) => (
                                <div
                                    key={cap.title}
                                    className={`relative p-8 rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-shadow ${cap.delay ? 'animate-float-delayed' : 'animate-float'}`}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-2xl opacity-80"></div>
                                    <h3 className="text-2xl font-bold mb-2">{cap.title}</h3>
                                    <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">{cap.subtitle}</p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {cap.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="faqs" className="w-full py-20 md:py-24 lg:py-32 bg-muted/30">
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

                <section id="pricing" className="w-full py-20 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Simple Pricing</h2>
                                <p className="max-w-[900px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                                    Choose the plan that fits your academic journey.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                            {pricingPackages.map((pkg, index) => (
                                <div key={index} className="relative flex flex-col p-6 bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden group">
                                    {/* Coming Soon Overlay */}
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-100 transition-opacity">
                                        <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Coming Soon
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 opacity-50">
                                        <h3 className="text-2xl font-bold">{pkg.title}</h3>
                                        <div className="text-3xl font-bold">{pkg.price}</div>
                                        <p className="text-muted-foreground text-sm">{pkg.description}</p>
                                    </div>
                                    <ul className="space-y-2 mb-6 flex-1 opacity-50">
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-primary" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="w-full mt-auto opacity-50 cursor-not-allowed" disabled>Choose Plan</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="contact" className="w-full py-20 md:py-24 lg:py-32 bg-muted/30">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Get in Touch</h2>
                                <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                                    Have questions or feedback? We'd love to hear from you.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center items-center mt-8">
                                <a
                                    href="mailto:priyanshurao369@gmail.com"
                                    className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    priyanshurao369@gmail.com
                                </a>
                            </div>
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
                        <Button variant='link' asChild className="text-xs hover:underline underline-offset-4">
                            <Link href="#pricing" prefetch={false}>
                                Pricing
                            </Link>
                        </Button>
                        <Button variant='link' asChild className="text-xs hover:underline underline-offset-4">
                            <Link href="#contact" prefetch={false}>
                                Contact
                            </Link>
                        </Button>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
