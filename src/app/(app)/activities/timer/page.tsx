
'use client';

import { useState } from 'react';
import { ActivityTimer } from "@/components/activity-timer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Timer } from 'lucide-react';

export default function TimerPage() {
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

    return (
        <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-background px-4 sm:px-6">
            <div className="w-full max-w-5xl">
                <Tabs defaultValue="timer" className="w-full h-full" onValueChange={(value) => setMode(value as 'timer' | 'stopwatch')}>
                    <TabsList className="mx-auto grid w-full max-w-sm grid-cols-2 rounded-full border border-slate-800/60 bg-slate-900/70 p-1 backdrop-blur">
                        <TabsTrigger value="timer" className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-slate-800/80 data-[state=active]:text-slate-100">
                            <Timer className="mr-2 h-4 w-4" />
                            Timer
                        </TabsTrigger>
                        <TabsTrigger value="stopwatch" className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-slate-800/80 data-[state=active]:text-slate-100">
                            <Clock className="mr-2 h-4 w-4" />
                            Stopwatch
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="timer" className="h-full">
                        <ActivityTimer mode="timer" />
                    </TabsContent>
                    <TabsContent value="stopwatch" className="h-full">
                        <ActivityTimer mode="stopwatch" />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
