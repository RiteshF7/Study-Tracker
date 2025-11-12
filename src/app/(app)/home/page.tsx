
'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/types';
import { ActivityTimer } from '@/components/activity-timer';
import { LiveSessionCard } from '@/components/live-session-card';

export default function HomePage() {
  const [isTiming, setIsTiming] = useState(false);
  const [timerConfig, setTimerConfig] = useState({
    mode: 'timer' as 'timer' | 'stopwatch',
    activityName: '',
    activityType: 'Study' as Activity['type'],
    category: '',
    duration: 25,
  });

  const handleStartTimer = (config: typeof timerConfig) => {
    setTimerConfig(config);
    setIsTiming(true);
  };

  const handleSessionEnd = () => {
    setIsTiming(false);
  };

  if (isTiming) {
    return (
      <ActivityTimer
        mode={timerConfig.mode}
        initialActivityName={timerConfig.activityName}
        initialActivityType={timerConfig.activityType}
        initialCategory={timerConfig.category}
        initialDuration={timerConfig.duration}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <LiveSessionCard onStartTimer={handleStartTimer} />
    </div>
  );
}
