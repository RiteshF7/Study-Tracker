
'use client';

import { useState } from 'react';
import { ActivityTimer } from "@/components/activity-timer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Timer } from 'lucide-react';

export default function TimerPage() {
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

    return (
        <div className="flex items-start justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl">
                <Tabs 
                    defaultValue="timer" 
                    className="flex flex-col sm:flex-row gap-4 sm:gap-8" 
                    onValueChange={(value) => setMode(value as 'timer' | 'stopwatch')}
                    orientation="vertical"
                >
                    <TabsList className="grid w-full sm:w-auto sm:grid-rows-2 sm:grid-cols-1">
                        <TabsTrigger value="timer" className="py-4">
                            <Timer className="mr-2 h-5 w-5" />
                            Timer
                        </TabsTrigger>
                        <TabsTrigger value="stopwatch" className="py-4">
                            <Clock className="mr-2 h-5 w-5" />
                            Stopwatch
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex-1">
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
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
