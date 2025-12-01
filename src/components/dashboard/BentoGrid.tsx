import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

interface BentoGridItemProps {
    children: ReactNode;
    className?: string;
    colSpan?: number;
    rowSpan?: number;
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]", className)}>
            {children}
        </div>
    );
}

export function BentoGridItem({ children, className, colSpan = 1, rowSpan = 1 }: BentoGridItemProps) {
    return (
        <div
            className={cn(
                "bg-background/60 backdrop-blur-xl rounded-xl border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md",
                colSpan === 2 && "md:col-span-2",
                colSpan === 3 && "md:col-span-3",
                colSpan === 4 && "md:col-span-4",
                rowSpan === 2 && "md:row-span-2",
                className
            )}
        >
            {children}
        </div>
    );
}
