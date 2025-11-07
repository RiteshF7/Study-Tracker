
"use client";

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
  type ChartConfig,
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
import { format, subDays, parseISO, startOfDay, parse } from "date-fns";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { generateMockActivities, generateMockProblems } from "@/lib/mock-data";

const activityChartConfig = {
  duration: {
    label: "Duration (min)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const problemChartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function DashboardClient() {
  const { firestore, user } = useFirebase();
  
  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);
  
  const problemsCollection = useMemoFirebase(() =>
    user ? collection(firestore, "users", user.uid, "problems") : null
  , [firestore, user]);

  const { data: realActivities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesCollection);
  const { data: realProblems, isLoading: isLoadingProblems } = useCollection<Problem>(problemsCollection);

  const { activities, problems } = useMemo(() => {
    const noRealData = (!realActivities || realActivities.length === 0) && (!realProblems || realProblems.length === 0);
    if (process.env.NODE_ENV === 'development' && noRealData && !isLoadingActivities && !isLoadingProblems) {
      return {
        activities: generateMockActivities(30),
        problems: generateMockProblems(30)
      };
    }
    return { activities: realActivities, problems: realProblems };
  }, [realActivities, realProblems, isLoadingActivities, isLoadingProblems]);


  const { activityData, totalDuration, productivityTrend } = useMemo(() => {
    if (!activities) return { activityData: [], totalDuration: 0, productivityTrend: null };

    const today = startOfDay(new Date());

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), "yyyy-MM-dd")).reverse();
    const last7DaysData = last7Days.map((date) => {
      const dailyActivities = activities.filter((a) => a.date === date);
      const totalDuration = dailyActivities.reduce((sum, a) => sum + a.duration, 0);
      return { date: format(parseISO(date), "d MMM"), duration: totalDuration };
    });
    const last7DaysTotal = last7DaysData.reduce((sum, d) => sum + d.duration, 0);

    // Previous 7 days (days 8-14 ago)
    const prev7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i + 7), "yyyy-MM-dd"));
    const prev7DaysTotal = prev7Days.reduce((total, date) => {
      const dailyActivities = activities.filter((a) => a.date === date);
      return total + dailyActivities.reduce((sum, a) => sum + a.duration, 0);
    }, 0);
    
    let trend: { percentage: number; hourDiff: number } | null = null;
    if (prev7DaysTotal > 0) {
      const percentage = ((last7DaysTotal - prev7DaysTotal) / prev7DaysTotal) * 100;
      const hourDiff = (last7DaysTotal - prev7DaysTotal) / 60;
      trend = { percentage, hourDiff };
    } else if (last7DaysTotal > 0) {
        trend = { percentage: 100, hourDiff: last7DaysTotal / 60 };
    }
    
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

    return { activityData: last7DaysData, totalDuration, productivityTrend: trend };
  }, [activities]);

  const problemData = useMemo(() => {
    if (!problems) return [];
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
    if (!problems) return 0;
    return problems.reduce((sum, p) => sum + p.count, 0);
  }, [problems]);

  const emptyStateImage = PlaceHolderImages.find(
    (img) => img.id === "empty-dashboard"
  );
  
  const isLoading = isLoadingActivities || isLoadingProblems;

  if (isLoading) {
      return (
          <div className="flex items-center justify-center text-center py-16">
                <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
      )
  }

  if (!activities || !problems || (activities.length === 0 && problems.length === 0)) {
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
              {productivityTrend ? (
                <>
                  <div className="text-2xl font-bold">
                    {productivityTrend.percentage >= 0 ? "+" : ""}
                    {productivityTrend.percentage.toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {`${productivityTrend.hourDiff.toFixed(1)} hours ${productivityTrend.hourDiff >= 0 ? 'more' : 'less'} than last week`}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">N/A</div>
                  <p className="text-xs text-muted-foreground">Not enough data</p>
                </>
              )}
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
            <ChartContainer config={activityChartConfig} className="min-h-[200px] w-full">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 5,
                    right: 20,
                    left: -10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickMargin={10} tickFormatter={(value) => format(parse(value, "d MMM", new Date()), 'EEE d')}/>
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="var(--color-duration)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
            </ChartContainer>
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
             <ChartContainer config={problemChartConfig} className="min-h-[200px] w-full">
                <BarChart data={problemData} margin={{ left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="subject"
                    tickLine={false}
                    axisLine={false}
                    stroke="#888888"
                    fontSize={12}
                    tickFormatter={(value) => value.slice(0, 3)}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={false}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
