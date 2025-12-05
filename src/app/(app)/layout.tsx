"use client";

import React from "react";

import { RadialMenu } from "@/components/radial-menu";
import { ManualEntryDialog } from "@/components/manual-entry-dialog";
import { ProfileDialog } from "@/components/profile-dialog";

import { MobileNav } from "@/components/mobile-nav";

import { FirebaseErrorBoundary } from "@/components/firebase-error-boundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseErrorBoundary>
      <div className="min-h-screen bg-background relative">
        <RadialMenu />
        <header className="fixed top-0 right-0 z-30 flex items-center gap-2 p-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <ManualEntryDialog />
            <ProfileDialog />
          </div>
        </header>
        <main className="p-4 sm:px-6 py-16 md:py-8">{children}</main>
        <MobileNav />
      </div>
    </FirebaseErrorBoundary>
  );
}
