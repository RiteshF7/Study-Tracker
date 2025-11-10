"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  LayoutDashboard,
  ListTodo,
  Target,
  BookOpenCheck,
  LogOut,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/activities",
    icon: ListTodo,
    label: "Activity Log",
  },
  {
    href: "/problems",
    icon: Target,
    label: "Problem Tracker",
  },
  {
    href: "/scheduler",
    icon: BrainCircuit,
    label: "AI Scheduler",
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold font-headline">StudyTrack</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  className={cn("w-full justify-start text-base", { // Increased font size
                    "bg-primary/10 text-primary hover:bg-primary/20 font-semibold": // Higher contrast
                      pathname === item.href,
                  })}
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
        <SidebarMenu>
          <SidebarMenuItem>
            {/* In a real app, this would trigger a logout function */}
            <SidebarMenuButton className="w-full justify-start text-muted-foreground hover:text-destructive">
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
