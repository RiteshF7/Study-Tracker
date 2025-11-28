"use client";

import { ProfileDialog } from "@/components/profile-dialog";

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
          <ProfileDialog />
        </header>
        <main className="p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
