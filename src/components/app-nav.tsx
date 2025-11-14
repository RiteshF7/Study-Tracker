
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
  CalendarDays,
  Settings,
  Home,
} from "lucide-react";
import { TrafficLight } from "@/components/icons/traffic-light";
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
import { useAuth } from "@/firebase";

const navItems = [
  {
    href: "/home",
    icon: Home,
    label: "Home",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/activities",
    icon: ListTodo,
    label: "Tracker",
  },
  {
    href: "/scheduler",
    icon: BrainCircuit,
    label: "AI Scheduler",
  },
  {
    href: "/planner",
    icon: CalendarDays,
    label: "Planner",
  },
  {
    href: "/sorting",
    icon: TrafficLight,
    label: "Sorting",
  },
];

export function AppNav() {
  const pathname = usePathname();
  const auth = useAuth();

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
