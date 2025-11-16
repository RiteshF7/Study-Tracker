'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LandingCarousel } from './landing-carousel';

interface FeatureCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureCarousel({
  open,
  onOpenChange,
}: FeatureCarouselProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[70vh] flex flex-col items-center justify-center p-0">
        <LandingCarousel />
      </DialogContent>
    </Dialog>
  );
}
