
'use client';

import { useState } from 'react';
import { ActivityTimer } from "@/components/activity-timer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Timer } from 'lucide-react';

export default function TimerPage() {
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-2 sm:p-4">
            <div className="w-full max-w-md">
                <Tabs defaultValue="timer" className="w-full" onValueChange={(value) => setMode(value as 'timer' | 'stopwatch')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="timer">
                            <Timer className="mr-2 h-4 w-4" />
                            Timer
                        </TabsTrigger>
                        <TabsTrigger value="stopwatch">
                            <Clock className="mr-2 h-4 w-4" />
                            Stopwatch
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="timer">
                        <div className="min-h-[550px]">
                            <ActivityTimer mode="timer" />
                        </div>
                    </TabsContent>
                    <TabsContent value="stopwatch">
                         <div className="min-h-[550px]">
                            <ActivityTimer mode="stopwatch" />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
