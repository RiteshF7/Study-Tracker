"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants/nav-items";
import { useAuth, useFirebase, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookOpenCheck, Settings, LogOut } from "lucide-react";
import { InstallPrompt } from "@/components/install-prompt";

export function AppNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useFirebase();

  // Load user profile doc for fallback name if displayName is missing
  const userDocRef = useMemoFirebase((fs) =>
    user ? doc(fs, "users", user.uid) : null,
    [user]);
  const { data: userProfile } = useDoc<{ name?: string; photoURL?: string }>(userDocRef);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">StudyTrack</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  className={cn("w-full justify-start text-base", {
                    "bg-primary/10 text-primary hover:bg-primary/20 font-semibold":
                      pathname.startsWith(item.href),
                  })}
                  tooltip={item.label}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarSeparator />
        {/* Signed-in user info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar>
              <AvatarImage src={(user.photoURL ?? userProfile?.photoURL) || undefined} alt={user.displayName ?? "User"} />
              <AvatarFallback>
                {(user.displayName || userProfile?.name || user.email || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.displayName || userProfile?.name || (user.email?.split('@')[0] ?? "User")}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email || ""}</span>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton
                isActive={pathname === "/settings"}
                className="w-full justify-start text-muted-foreground"
                tooltip="Settings"
              >
                <Settings className="mr-2 h-5 w-5" />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <InstallPrompt />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              tooltip="Logout"
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="p-4 text-center text-xs text-muted-foreground/50">
          <p>&copy; 2024 StudyTrack Journal</p>
        </div>
      </SidebarFooter>
    </>
  );
}
