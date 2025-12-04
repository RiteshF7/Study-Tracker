import {
    BrainCircuit,
    LayoutDashboard,
    ListTodo,
    Home,
    ScrollText,
    Library,
} from "lucide-react";
import { TrafficLight } from "@/components/icons/traffic-light";

export const navItems = [
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
        label: "Track",
    },
    {
        href: "/scheduler",
        icon: BrainCircuit,
        label: "AI Planner",
    },
    {
        href: "/sorting",
        icon: TrafficLight,
        label: "Sorting",
    },
    {
        href: "/diary",
        icon: ScrollText,
        label: "Diary",
    },
    {
        href: "/library",
        icon: Library,
        label: "Library",
    }
];
