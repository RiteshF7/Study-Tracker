
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
import { useMemo, useState } from "react";
import { format, subDays, parseISO, startOfDay, parse, eachDayOfInterval, startOfWeek, isSameWeek, endOfWeek, eachWeekOfInterval, addDays, getWeek, subMonths, differenceInDays } from "date-fns";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart3, Clock, Target, TrendingUp, Goal, CheckCircle, ChevronDown, Flame } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { generateMockActivities, generateMockProblems } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "./ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

type UserProfile = {
  name?: string;
  learningGoals?: string;
}

const timeRangeOptions = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 3 Months',
  '180d': 'Last 6 Months',
};

function TodaysGoal() {
  const today = new Date().toISOString().split('T')[0];
  const [dailyGoal, setDailyGoal] = useLocalStorage<string>(`daily-goal-${today}`, '');
  const [inputValue, setInputValue] = useState('');

  const handleSave = () => {
    setDailyGoal(inputValue);
    setInputValue('');
  };
  
  if (dailyGoal) {
    return (
      <Card className="bg-accent/50 border-accent/30">
        <CardHeader>
          <CardTitle className="text-accent-foreground/80">Today's Focus</CardTitle>
          <CardDescription>Your main objective for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-lg font-semibold text-foreground flex-1">
              {dailyGoal}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDailyGoal('')}>Edit</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What is your goal for today?</CardTitle>
        <CardDescription>Set a short-term objective to guide your study session.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input 
            placeholder="e.g., 'Finish chapter 3 of Anatomy'"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button onClick={handleSave} disabled={!inputValue.trim()}>Save Goal</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardClient() {
  const { firestore, user } = useFirebase();
  const [timeRange, setTimeRange] = useState<keyof typeof timeRangeOptions>('7d');
  
  const userDocRef = useMemoFirebase(() => 
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);
  
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
    if (process.env.NODE_ENV === 'development' && noRealData && !isLoadingActivities && !isLoadingProblems && !isLoadingProfile) {
      return {
        activities: generateMockActivities(180), // Generate more data for filtering
        problems: generateMockProblems(180)
      };
    }
    return { activities: realActivities, problems: realProblems };
  }, [realActivities, realProblems, isLoadingActivities, isLoadingProblems, isLoadingProfile]);


  const studyStreak = useMemo(() => {
    if (!activities || activities.length === 0) return 0;
    
    const uniqueDates = [...new Set(activities.map(a => a.date))].map(d => startOfDay(parseISO(d))).sort((a, b) => b.getTime() - a.getTime());

    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const today = startOfDay(new Date());
    const firstDate = uniqueDates[0];

    // Check if the most recent activity was today or yesterday
    if (differenceInDays(today, firstDate) <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = differenceInDays(uniqueDates[i-1], uniqueDates[i]);
        if (diff === 1) {
          streak++;
        } else {
          break; // Streak is broken
        }
      }
    }
    
    return streak;

  }, [activities]);

  const { activityData, totalDuration, productivityTrend } = useMemo(() => {
    if (!activities) return { activityData: [], totalDuration: 0, productivityTrend: null };

    const productiveActivities = activities.filter(
      (a) => a.type === 'Study' || a.type === 'Class'
    );
    
    const today = startOfDay(new Date());
    let startDate: Date;
    let tickFormatter: (value: string) => string = (value) => value;

    switch(timeRange) {
      case '30d':
        startDate = subDays(today, 29);
        tickFormatter = (value) => format(parse(value, "d MMM", new Date()), 'd');
        break;
      case '90d':
        startDate = subMonths(today, 3);
        tickFormatter = (value) => `W${value}`;
        break;
      case '180d':
        startDate = subMonths(today, 6);
        tickFormatter = (value) => format(parseISO(value), 'MMM');
        break;
      case '7d':
      default:
        startDate = subDays(today, 6);
        tickFormatter = (value) => format(parse(value, "d MMM", new Date()), 'EEE');
        break;
    }

    const relevantActivities = productiveActivities.filter(a => parseISO(a.date) >= startDate);
    
    let groupedData;

    if (timeRange === '90d' || timeRange === '180d') {
        const weekMap = new Map<string, number>();
        relevantActivities.forEach(activity => {
            const weekNumber = getWeek(parseISO(activity.date));
            const year = parseISO(activity.date).getFullYear();
            const key = `${year}-W${weekNumber}`;
            weekMap.set(key, (weekMap.get(key) || 0) + activity.duration);
        });

        const weeks = eachWeekOfInterval({ start: startDate, end: today });
        groupedData = weeks.map(weekStart => {
            const weekNumber = getWeek(weekStart);
            const year = weekStart.getFullYear();
            const key = `${year}-W${weekNumber}`;
            const totalDuration = weekMap.get(key) || 0;
            return { date: `${weekNumber}`, duration: totalDuration };
        });
        if(timeRange === '180d') tickFormatter = (value) => `W${value}`;
    } else {
       const dayMap = new Map<string, number>();
        relevantActivities.forEach(activity => {
            dayMap.set(activity.date, (dayMap.get(activity.date) || 0) + activity.duration);
        });
        
        const days = eachDayOfInterval({ start: startDate, end: today });
        groupedData = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return {
                date: format(day, 'd MMM'),
                duration: dayMap.get(dateStr) || 0
            };
        });
    }

    // Trend calculation remains for last 7 days vs previous 7 days for simplicity
    const last7DaysTotal = productiveActivities
      .filter(a => parseISO(a.date) >= subDays(today, 6))
      .reduce((sum, a) => sum + a.duration, 0);

    const prev7DaysTotal = productiveActivities
      .filter(a => {
        const activityDate = parseISO(a.date);
        return activityDate >= subDays(today, 13) && activityDate < subDays(today, 6);
      })
      .reduce((sum, a) => sum + a.duration, 0);

    let trend: { percentage: number; hourDiff: number } | null = null;
    if (prev7DaysTotal > 0) {
      const percentage = ((last7DaysTotal - prev7DaysTotal) / prev7DaysTotal) * 100;
      const hourDiff = (last7DaysTotal - prev7DaysTotal) / 60;
      trend = { percentage, hourDiff };
    } else if (last7DaysTotal > 0) {
        trend = { percentage: 100, hourDiff: last7DaysTotal / 60 };
    }
    
    const totalDuration = productiveActivities.reduce((sum, a) => sum + a.duration, 0);

    return { activityData: { data: groupedData, formatter: tickFormatter }, totalDuration, productivityTrend: trend };
  }, [activities, timeRange]);

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
  
  const isLoading = isLoadingActivities || isLoadingProblems || isLoadingProfile;

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
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
                Welcome back, {userProfile?.name || 'Student'}!
            </h2>
            <p className="text-muted-foreground">Here's a snapshot of your progress.</p>
        </div>

        <TodaysGoal />
        
        {userProfile?.learningGoals && (
          <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-start gap-4">
                  <Goal className="w-6 h-6 text-primary mt-1" />
                  <div>
                      <CardTitle className="text-primary">Your Main Goal</CardTitle>
                      <CardDescription className="text-primary/80">Keep this in mind to stay motivated.</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                  <p className="text-lg font-semibold text-foreground">
                      {userProfile.learningGoals}
                  </p>
              </CardContent>
          </Card>
        )}

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
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{studyStreak} days</div>
                <p className="text-xs text-muted-foreground">Consecutive days of activity</p>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>
                  Total minutes spent on logged activities.
                </CardDescription>
              </div>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as keyof typeof timeRangeOptions)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeRangeOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityChartConfig} className="min-h-[200px] w-full">
                <LineChart
                  data={activityData.data}
                  margin={{
                    top: 5,
                    right: 20,
                    left: -10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickMargin={10} tickFormatter={activityData.formatter}/>
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

       {!userProfile?.learningGoals && (
        <Card>
          <CardHeader>
            <CardTitle>Set Your Learning Goal</CardTitle>
            <CardDescription>
              Define your primary objective to stay focused and motivated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Goal className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground">
                  You haven't set a learning goal yet. Head over to the settings page to add one.
                </p>
              </div>
              <Button asChild>
                <Link href="/settings">Go to Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    