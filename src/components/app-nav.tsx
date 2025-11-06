"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  LayoutDashboard,
  ListTodo,
  Target,
  BookOpenCheck,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
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
          <BookOpenCheck className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold font-headline">StudyTrack</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn("w-full justify-start", {
                    "bg-primary/10 text-primary hover:bg-primary/20":
                      pathname === item.href,
                  })}
                >
                  <a>
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          <p>&copy; 2024 StudyTrack Journal</p>
        </div>
      </SidebarFooter>
    </>
  );
}
