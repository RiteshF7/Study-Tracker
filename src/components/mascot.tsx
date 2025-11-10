
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

type MascotState = 'default' | 'happy' | 'sleepy';

interface MascotProps {
  studyTimeToday: number; // in minutes
}

export function Mascot({ studyTimeToday }: MascotProps) {
  const [mascotState, setMascotState] = useState<MascotState>('default');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (studyTimeToday > 60) {
      setMascotState('happy');
    } else {
      setMascotState('default'); 
    }
  }, [studyTimeToday]);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const mascotImage = PlaceHolderImages.find(img => img.id === `mascot-${mascotState}`);
  const message = {
    happy: "Great job! Keep up the amazing work!",
    default: "Hi! I'm Olaf and I like warm hugs!",
    sleepy: "Ready to start a study session?"
  }[mascotState];

  if (!mascotImage) return null;

  return (
    <div className={cn("relative flex flex-col items-center transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      <div className="w-24 h-24 relative">
        <Image
          src={mascotImage.imageUrl}
          alt={mascotImage.description}
          width={96}
          height={96}
          className="rounded-full object-cover shadow-lg border-4 border-card"
          data-ai-hint={mascotImage.imageHint}
        />
      </div>
       <div className="mt-2 text-center text-sm font-medium text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm max-w-40">
        {message}
      </div>
    </div>
  );
}
