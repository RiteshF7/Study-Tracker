"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants/nav-items";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/firebase/provider";

export function RadialMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    const auth = useAuth();

    const handleLogout = () => {
        if (auth) {
            auth.signOut();
        }
    };

    // Find the current active item based on pathname
    const currentItem = navItems.find((item) => pathname.startsWith(item.href)) || navItems[0];
    const CurrentIcon = currentItem.icon;

    const toggleMenu = () => setIsOpen(!isOpen);

    // Close menu when clicking outside or pressing Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Calculate active index based on mouse angle relative to center
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!menuRef.current) return;

        const rect = menuRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle in degrees (0-360)
        // Math.atan2(y, x) returns angle in radians. 
        // We adjust x and y to match standard circle (0 deg at 3 o'clock)
        // But for our menu, we might want 0 at 12 o'clock.
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        // Distance check to avoid selecting when too close to center
        const distance = Math.sqrt(x * x + y * y);
        if (distance < 50) {
            setActiveIndex(null);
            return;
        }

        let angle = Math.atan2(y, x) * (180 / Math.PI);
        // Convert to 0-360 positive
        if (angle < 0) angle += 360;

        // Adjust so that the angle aligns with our items
        // We have N items distributed over 360 degrees.
        // Each item takes up 360/N degrees.
        // We need to map the mouse angle to the closest item index.

        const segmentSize = 360 / navItems.length;
        // Offset angle by -90 (to start from top) and half segment to center the hit area
        // Actually, let's just map it directly.
        // 0 degrees is 3 o'clock.
        // We position items starting from -90 deg (12 o'clock).

        // Let's normalize angle to start from -90 (12 o'clock)
        let normalizedAngle = angle + 90 + (segmentSize / 2);
        if (normalizedAngle >= 360) normalizedAngle -= 360;

        const index = Math.floor(normalizedAngle / segmentSize);
        setActiveIndex(index % navItems.length);
    };

    return (
        <>
            {/* Trigger Button - Top Left */}
            <button
                onClick={toggleMenu}
                className="fixed top-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)] hover:scale-110 transition-transform duration-300"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                    onMouseMove={handleMouseMove}
                >
                    {/* Menu Container */}
                    <div
                        ref={menuRef}
                        className="relative w-[400px] h-[400px] rounded-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the wheel
                    >
                        {/* Center Circle - Current Page */}
                        <div className="absolute z-10 w-24 h-24 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
                            <CurrentIcon className="w-10 h-10 text-primary" />
                            <span className="absolute -bottom-8 text-sm font-bold text-foreground bg-background/80 px-2 py-1 rounded-md">
                                {currentItem.label}
                            </span>
                        </div>

                        {/* Radial Items */}
                        {[
                            ...navItems,
                            { href: "/settings", icon: Settings, label: "Settings" },
                            { href: "#logout", icon: LogOut, label: "Logout", action: handleLogout }
                        ].map((item, index, array) => {
                            const totalItems = array.length;
                            const angle = (index * (360 / totalItems)) - 90; // Start at -90 (12 o'clock)
                            const radius = 140; // Distance from center

                            // Convert polar to cartesian
                            const x = radius * Math.cos((angle * Math.PI) / 180);
                            const y = radius * Math.sin((angle * Math.PI) / 180);

                            const isActive = activeIndex === index;

                            const content = (
                                <>
                                    <item.icon className="w-6 h-6" />
                                    {isActive && (
                                        <span className="absolute -bottom-6 text-xs font-bold whitespace-nowrap bg-background/80 px-2 py-0.5 rounded text-foreground">
                                            {item.label}
                                        </span>
                                    )}
                                </>
                            );

                            const className = cn(
                                "absolute flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300",
                                "hover:scale-125 hover:-translate-y-2", // Lift up effect
                                isActive
                                    ? "bg-primary text-primary-foreground scale-125 shadow-[0_0_20px_hsl(var(--primary))]"
                                    : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                            );

                            const style = {
                                transform: `translate(${x}px, ${y}px)`,
                                animation: `float 3s ease-in-out infinite ${index * 0.5}s`
                            };

                            // @ts-ignore
                            if (item.action) {
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            // @ts-ignore
                                            item.action();
                                            setIsOpen(false);
                                        }}
                                        className={className}
                                        style={style}
                                    >
                                        {content}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={className}
                                    style={style}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes float {
          0% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) translateY(0px); }
          50% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) translateY(-5px); }
          100% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) translateY(0px); }
        }
      `}</style>
        </>
    );
}
