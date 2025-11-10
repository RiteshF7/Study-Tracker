
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
import { format, subDays, parseISO, startOfDay, parse, eachDayOfInterval, startOfWeek, isSameWeek, endOfWeek, eachWeekOfInterval, addDays, getWeek, subMonths, differenceInDays, addMonths, addWeeks, isToday, subWeeks, sub } from "date-fns";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart3, Clock, Target, TrendingUp, Goal, CheckCircle, ChevronDown, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { generateMockActivities, generateMockProblems } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "./ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Mascot } from "./mascot";

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

type TimeRangeKey = '7d' | '30d' | '90d' | '180d';

const timeRangeOptions: Record<TimeRangeKey, string> = {
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
      <Card className="bg-primary border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary-foreground">Today's Focus</CardTitle>
          <CardDescription className="text-primary-foreground/80">Your main objective for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <p className="text-lg font-semibold text-primary-foreground flex-1">
              {dailyGoal}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDailyGoal('')} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary/20">Edit</Button>
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
              placeholder="e.g., 'Review lecture notes for 2 hours'"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} disabled={!inputValue.trim()}>Save Goal</Button>
          </div>
        </CardContent>
      </Card>
  );
}

export function DashboardClient() {
  const { firestore, user } = useFirebase();
  const [activityTimeRange, setActivityTimeRange] = useState<TimeRangeKey>('7d');
  const [problemTimeRange, setProblemTimeRange] = useState<TimeRangeKey>('7d');
  const [activityEndDate, setActivityEndDate] = useState(() => startOfDay(new Date()));
  const [problemEndDate, setProblemEndDate] = useState(() => startOfDay(new Date()));
  
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
        activities: generateMockActivities(365),
        problems: generateMockProblems(365)
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
  
  const getInterval = (endDate: Date, timeRange: TimeRangeKey) => {
     switch (timeRange) {
      case '30d': return { start: subDays(endDate, 29), end: endDate };
      case '90d': return { start: subMonths(endDate, 3), end: endDate };
      case '180d': return { start: subMonths(endDate, 6), end: endDate };
      case '7d':
      default: return { start: subDays(endDate, 6), end: endDate };
    }
  }
  
  const handleDateNavigation = (
    direction: 'prev' | 'next', 
    timeRange: TimeRangeKey, 
    currentEndDate: Date, 
    setEndDate: (date: Date) => void
  ) => {
    let newEndDate: Date;
    const amount = direction === 'prev' ? -1 : 1;
    switch(timeRange) {
        case '7d':
        case '30d':
            newEndDate = addDays(currentEndDate, amount * (timeRange === '7d' ? 7 : 30));
            break;
        case '90d':
        case '180d':
            newEndDate = addMonths(currentEndDate, amount * (timeRange === '90d' ? 3: 6));
            break;
        default:
            newEndDate = addDays(currentEndDate, amount);
    }

    if (newEndDate > startOfDay(new Date())) {
        newEndDate = startOfDay(new Date());
    }
    setEndDate(newEndDate);
  };

  const { activityData, activityDateRange } = useMemo(() => {
    if (!activities) return { activityData: { data: [], formatter: (v: string) => v }, totalDuration: 0, productivityTrend: null, activityDateRange: '' };

    const productiveActivities = activities.filter(
      (a) => a.type === 'Study' || a.type === 'Class'
    );
    
    const { start: startDate, end: endDate } = getInterval(activityEndDate, activityTimeRange);
    let tickFormatter: (value: string) => string = (value) => value;

    const relevantActivities = productiveActivities.filter(a => {
        const activityDate = parseISO(a.date);
        return activityDate >= startDate && activityDate <= endDate;
    });
    
    let groupedData;

    if (activityTimeRange === '90d' || activityTimeRange === '180d') {
        const weekMap = new Map<string, number>();
        relevantActivities.forEach(activity => {
            const weekStartForActivity = startOfWeek(parseISO(activity.date));
            const key = format(weekStartForActivity, 'yyyy-MM-dd');
            weekMap.set(key, (weekMap.get(key) || 0) + activity.duration);
        });

        const weeksInInterval = eachWeekOfInterval({ start: startDate, end: endDate });
        groupedData = weeksInInterval.map(weekStart => {
            const key = format(weekStart, 'yyyy-MM-dd');
            return { date: `W${getWeek(weekStart)}`, duration: weekMap.get(key) || 0 };
        });
        tickFormatter = (value) => value;
    } else {
       const dayMap = new Map<string, number>();
        relevantActivities.forEach(activity => {
            dayMap.set(activity.date, (dayMap.get(activity.date) || 0) + activity.duration);
        });
        
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        groupedData = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const formatStr = activityTimeRange === '7d' ? 'EEE' : 'd';
            return {
                date: format(day, formatStr),
                duration: dayMap.get(dateStr) || 0
            };
        });
        tickFormatter = (value) => value;
    }
    
    const dateRangeStr = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

    return { activityData: { data: groupedData, formatter: tickFormatter }, activityDateRange: dateRangeStr };
  }, [activities, activityTimeRange, activityEndDate]);
  
  const { studyTimeToday, todaysActivities } = useMemo(() => {
    if (!activities) return { studyTimeToday: 0, todaysActivities: [] };
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysProductiveActivities = activities
      .filter(a => a.date === todayStr && (a.type === 'Study' || a.type === 'Class'));
    
    const totalMinutes = todaysProductiveActivities.reduce((sum, a) => sum + a.duration, 0);

    return { studyTimeToday: totalMinutes, todaysActivities: todaysProductiveActivities };
  }, [activities]);

  const { problemsPerDayData, problemDateRange } = useMemo(() => {
    if (!problems) return { problemsPerDayData: { data: [], formatter: (v: string) => v }, problemDateRange: '' };

    const { start: startDate, end: endDate } = getInterval(problemEndDate, problemTimeRange);
    let tickFormatter: (value: string) => string = (value) => value;


    const relevantProblems = problems.filter(p => {
        const problemDate = parseISO(p.date);
        return problemDate >= startDate && problemDate <= endDate;
    });

    let groupedData;

    if (problemTimeRange === '90d' || problemTimeRange === '180d') {
        const weekMap = new Map<string, number>();
        relevantProblems.forEach(problem => {
            const weekStartForProblem = startOfWeek(parseISO(problem.date));
            const key = format(weekStartForProblem, 'yyyy-MM-dd');
            weekMap.set(key, (weekMap.get(key) || 0) + problem.count);
        });

        const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
        groupedData = weeks.map(weekStart => {
            const key = format(weekStart, 'yyyy-MM-dd');
            return { date: `W${getWeek(weekStart)}`, count: weekMap.get(key) || 0 };
        });
        tickFormatter = (value) => value;
    } else {
        const dayMap = new Map<string, number>();
        relevantProblems.forEach(problem => {
            dayMap.set(problem.date, (dayMap.get(problem.date) || 0) + problem.count);
        });

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        groupedData = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const formatStr = problemTimeRange === '7d' ? 'EEE' : 'd';
            return {
                date: format(day, formatStr),
                count: dayMap.get(dateStr) || 0
            };
        });
         tickFormatter = (value) => value;
    }
    
    const dateRangeStr = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

    return { problemsPerDayData: { data: groupedData, formatter: tickFormatter }, problemDateRange: dateRangeStr };
  }, [problems, problemTimeRange, problemEndDate]);

  const { thisWeekMinutes, lastWeekMinutes, weeklyTrendPercentage } = useMemo(() => {
    if (!activities) return { thisWeekMinutes: 0, lastWeekMinutes: 0, weeklyTrendPercentage: 0 };

    const today = new Date();
    const productiveActivities = activities.filter(
      (a) => a.type === 'Study' || a.type === 'Class'
    );
    
    const thisWeekMinutes = productiveActivities
      .filter(a => isSameWeek(parseISO(a.date), today, { weekStartsOn: 1 }))
      .reduce((sum, a) => sum + a.duration, 0);

    const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    const lastWeekMinutes = productiveActivities
      .filter(a => isSameWeek(parseISO(a.date), lastWeekStart, { weekStartsOn: 1 }))
      .reduce((sum, a) => sum + a.duration, 0);
      
    let weeklyTrendPercentage = 0;
    if (lastWeekMinutes > 0) {
      weeklyTrendPercentage = ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100;
    } else if (thisWeekMinutes > 0) {
      weeklyTrendPercentage = 100; // Infinite growth technically, show as 100%
    }

    return { thisWeekMinutes, lastWeekMinutes, weeklyTrendPercentage };
  }, [activities]);

  const problemsSolvedToday = useMemo(() => {
    if (!problems) return 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return problems
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + p.count, 0);
  }, [problems]);

  const emptyStateImage = PlaceHolderImages.find(
    (img) => img.id === "empty-dashboard"
  );
  
  const isLoading = isLoadingActivities || isLoadingProblems || isLoadingProfile;
  
  const formattedStudyTime = useMemo(() => {
    if (studyTimeToday === 0) return "0m";
    const hours = Math.floor(studyTimeToday / 60);
    const minutes = studyTimeToday % 60;
    let timeString = "";
    if (hours > 0) {
      timeString += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
      timeString += `${minutes}m`;
    }
    return timeString.trim();
  }, [studyTimeToday]);

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
          <img
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {userProfile?.name || 'Student'}!
          </h2>
          <p className="text-muted-foreground">Here's a snapshot of your progress.</p>
        </div>
        <Mascot studyTimeToday={studyTimeToday} />
      </div>

      {userProfile?.learningGoals && (
        <Card className="bg-primary/5 border-primary/20 shadow-lg shadow-primary/30">
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

      <TodaysGoal />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved Today</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{problemsSolvedToday}</div>
          </CardContent>
        </Card>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Time Today</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formattedStudyTime}</div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Weekly Study Comparison</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{Math.floor(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Last Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{Math.floor(lastWeekMinutes / 60)}h {lastWeekMinutes % 60}m</p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">Weekly Trend</CardTitle>
                         <TrendingUp className={cn("h-5 w-5", weeklyTrendPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180')} />
                    </CardHeader>
                    <CardContent>
                       <p className={cn("text-2xl font-bold", weeklyTrendPercentage >= 0 ? 'text-green-500' : 'text-red-500')}>
                          {weeklyTrendPercentage >= 0 ? '+' : ''}{weeklyTrendPercentage.toFixed(0)}%
                       </p>
                       <p className="text-xs text-muted-foreground">
                           Compared to last week
                       </p>
                    </CardContent>
                </Card>
            </div>
            <DialogHeader>
              <DialogTitle>Today's Activities</DialogTitle>
            </DialogHeader>
            {todaysActivities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaysActivities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell className="text-right">{activity.duration} min</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t">
                       <TableCell>Total</TableCell>
                       <TableCell className="text-right">{studyTimeToday} min</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No study sessions logged for today.</p>
            )}
          </DialogContent>
        </Dialog>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activity Trends</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activityData.data.reduce((acc, item) => acc + item.duration, 0)} min</div>
                        <p className="text-xs text-muted-foreground">Total in selected period</p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Activity Trends</DialogTitle>
                    <DialogDescription>
                    Total minutes spent on logged activities.
                    </DialogDescription>
                 </DialogHeader>
                 <Card className="shadow-none border-none">
                    <CardHeader>
                        <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">{activityDateRange}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleDateNavigation('prev', activityTimeRange, activityEndDate, setActivityEndDate)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Select value={activityTimeRange} onValueChange={(value) => setActivityTimeRange(value as TimeRangeKey)}>
                                <SelectTrigger className="w-auto">
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(timeRangeOptions).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => handleDateNavigation('next', activityTimeRange, activityEndDate, setActivityEndDate)} disabled={isToday(activityEndDate)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={activityChartConfig} className="min-h-[300px] w-full">
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
            </DialogContent>
        </Dialog>
         <Dialog>
            <DialogTrigger asChild>
                 <Card className="cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{problemsPerDayData.data.reduce((acc, item) => acc + item.count, 0)}</div>
                        <p className="text-xs text-muted-foreground">Total in selected period</p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Problems Solved</DialogTitle>
                    <DialogDescription>
                    Your problem-solving trend.
                    </DialogDescription>
                 </DialogHeader>
                 <Card className="shadow-none border-none">
                    <CardHeader>
                        <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">{problemDateRange}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleDateNavigation('prev', problemTimeRange, problemEndDate, setProblemEndDate)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Select value={problemTimeRange} onValueChange={(value) => setProblemTimeRange(value as TimeRangeKey)}>
                                <SelectTrigger className="w-auto">
                                <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                {Object.entries(timeRangeOptions).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => handleDateNavigation('next', problemTimeRange, problemEndDate, setProblemEndDate)} disabled={isToday(problemEndDate)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={problemChartConfig} className="min-h-[300px] w-full">
                        <BarChart
                            data={problemsPerDayData.data}
                            margin={{
                            top: 5,
                            right: 20,
                            left: -10,
                            bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickMargin={10} tickFormatter={problemsPerDayData.formatter}/>
                            <YAxis />
                            <ChartTooltip
                            content={<ChartTooltipContent />}
                            cursor={false}
                            />
                            <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={4}
                            />
                        </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
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
