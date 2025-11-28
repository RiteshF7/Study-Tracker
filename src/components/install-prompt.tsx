"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // Check if already in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt || isInstalled) {
        return null;
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={handleInstallClick}
                className="w-full justify-start text-muted-foreground hover:text-primary"
                tooltip="Install App"
            >
                <Download className="mr-2 h-5 w-5" />
                <span>Install App</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
