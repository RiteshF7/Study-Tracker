"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Activity, Problem } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { format, subDays } from "date-fns";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";

export function DashboardClient() {
  const [activities] = useLocalStorage<Activity[]>("activities", []);
  const [problems] = useLocalStorage<Problem[]>("problems", []);

  const { activityData, totalDuration } = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), i), "yyyy-MM-dd")
    ).reverse();

    const data = last7Days.map((date) => {
      const dailyActivities = activities.filter((a) => a.date === date);
      const totalDuration = dailyActivities.reduce(
        (sum, a) => sum + a.duration,
        0
      );
      return { date: format(new Date(date), "MMM d"), duration: totalDuration };
    });

    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

    return { activityData: data, totalDuration };
  }, [activities]);

  const problemData = useMemo(() => {
    const subjectMap = new Map<string, number>();
    problems.forEach((p) => {
      subjectMap.set(p.subject, (subjectMap.get(p.subject) || 0) + p.count);
    });
    return Array.from(subjectMap.entries()).map(([subject, count]) => ({
      subject,
      count,
    }));
  }, [problems]);

  const totalProblemsSolved = useMemo(() => {
    return problems.reduce((sum, p) => sum + p.count, 0);
  }, [problems]);

  const emptyStateImage = PlaceHolderImages.find(
    (img) => img.id === "empty-dashboard"
  );

  if (activities.length === 0 && problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        {emptyStateImage && (
          <Image
            src={emptyStateImage.imageUrl}
            alt={emptyStateImage.description}
            width={300}
            height={200}
            className="rounded-lg mb-6 shadow-md"
            data-ai-hint={emptyStateImage.imageHint}
          />
        )}
        <h2 className="text-2xl font-semibold mb-2">
          Welcome to Your StudyTrack Journal
        </h2>
        <p className="text-muted-foreground max-w-md">
          Start by logging your study activities and tracking solved problems to
          see your progress beautifully visualized here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Problems Solved</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalProblemsSolved}</div>
                <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{(totalDuration / 60).toFixed(1)} hours</div>
                <p className="text-xs text-muted-foreground">Total time logged</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+12%</div>
                <p className="text-xs text-muted-foreground">From last week (mock data)</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Focus Areas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{problemData.length} Subjects</div>
                <p className="text-xs text-muted-foreground">Currently being tracked</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends (Last 7 Days)</CardTitle>
            <CardDescription>
              Total minutes spent on logged activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Duration (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Problems Solved by Subject</CardTitle>
            <CardDescription>
              A breakdown of all problems you've tracked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={problemData}>
                <XAxis
                  dataKey="subject"
                  tickLine={false}
                  axisLine={false}
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
