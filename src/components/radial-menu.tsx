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

    // Calculate active index based on mouse/touch angle relative to center
    const handleMove = (clientX: number, clientY: number) => {
        if (!menuRef.current) return;

        const rect = menuRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = clientX - centerX;
        const y = clientY - centerY;

        // Distance check to avoid selecting when too close to center
        const distance = Math.sqrt(x * x + y * y);
        if (distance < 50) {
            setActiveIndex(null);
            return;
        }

        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const segmentSize = 360 / navItems.length;
        // Offset angle by -90 (to start from top) and half segment to center the hit area
        let normalizedAngle = angle + 90 + (segmentSize / 2);
        if (normalizedAngle >= 360) normalizedAngle -= 360;

        const index = Math.floor(normalizedAngle / segmentSize);
        setActiveIndex(index % navItems.length);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Prevent scrolling while dragging on the menu
        // e.preventDefault(); // React synthetic events might not support this directly in all cases, but let's try or rely on CSS touch-action
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
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
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 touch-none"
                    onClick={() => setIsOpen(false)}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                >
                    {/* Menu Container */}
                    <div
                        ref={menuRef}
                        className="relative w-[400px] h-[400px] rounded-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
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
                            const angle = (index * (360 / totalItems)) - 90;
                            const radius = 140;

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

                            const innerClassName = cn(
                                "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300",
                                "hover:scale-125 hover:-translate-y-2",
                                isActive
                                    ? "bg-primary text-primary-foreground scale-125 shadow-[0_0_20px_hsl(var(--primary))]"
                                    : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                            );

                            const animationStyle = {
                                animation: `float 3s ease-in-out infinite ${index * 0.5}s`
                            };

                            // Wrapper div handles positioning
                            return (
                                <div
                                    key={item.label}
                                    className="absolute w-16 h-16 flex items-center justify-center"
                                    style={{
                                        transform: `translate(${x}px, ${y}px)`,
                                    }}
                                >
                                    {/* Inner element handles animation and interaction */}
                                    {item.action ? (
                                        <button
                                            onClick={() => {
                                                item.action!();
                                                setIsOpen(false);
                                            }}
                                            className={innerClassName}
                                            style={animationStyle}
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={innerClassName}
                                            style={animationStyle}
                                        >
                                            {content}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
        </>
    );
}
