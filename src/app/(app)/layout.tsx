"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ManualEntryDialog } from "@/components/manual-entry-dialog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <AppNav />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <div className="flex items-center gap-2 mt-8">
            <SidebarTrigger className="shadow-[0_0_15px_hsl(var(--glow)/0.5)] hover:shadow-[0_0_20px_hsl(var(--glow)/0.7)]" />
          </div>
          <div className="relative ml-auto flex items-center gap-2 md:grow-0">
            <ManualEntryDialog />
          </div>
          <Link href="/settings" passHref>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full transition-all hover:-translate-y-px"
              asChild
            >
              <Avatar>
                <AvatarImage
                  src="https://picsum.photos/seed/avatar/32/32"
                  alt="User Avatar"
                  data-ai-hint="user avatar"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </Link>
        </header>
        <main className="p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
