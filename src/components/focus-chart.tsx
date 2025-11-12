
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Brush } from "recharts"
import { format, subDays, startOfDay, parseISO, addDays } from "date-fns"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Activity } from "@/lib/types"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type TimeRange = 7 | 30 | 90 | 180;

interface FocusChartProps {
    activities: Activity[];
}

export function FocusChart({ activities }: FocusChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(30);
  const [endDate, setEndDate] = React.useState(() => startOfDay(new Date()));

  const handlePrev = () => {
    setEndDate(prev => subDays(prev, timeRange));
  };
  
  const handleNext = () => {
    setEndDate(prev => addDays(prev, timeRange));
  };
  
  const isNextDisabled = format(endDate, 'yyyy-MM-dd') === format(startOfDay(new Date()), 'yyyy-MM-dd');


  const chartData = React.useMemo(() => {
    const startDate = startOfDay(subDays(endDate, timeRange - 1));
    
    const dataMap = new Map<string, number>();

    // Initialize all days in the range with 0 duration
    for (let i = 0; i < timeRange; i++) {
        const date = addDays(startDate, i);
        dataMap.set(format(date, "yyyy-MM-dd"), 0);
    }
    
    activities.forEach((activity) => {
        const activityDate = startOfDay((activity.createdAt as any)?.toDate ? (activity.createdAt as any).toDate() : parseISO(activity.date));
        if (activityDate >= startDate && activityDate <= endDate) {
            const dateKey = format(activityDate, "yyyy-MM-dd");
            dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + activity.duration);
        }
    });

    return Array.from(dataMap.entries())
        .map(([date, duration]) => ({
            date: date,
            duration,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  }, [activities, timeRange, endDate]);

  const chartConfig = {
    duration: {
      label: "Duration (min)",
      color: "hsl(var(--primary))",
    },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];

  const yAxisDomain = [0, Math.max(240, ...chartData.map(d => d.duration))];
  const brushDomain = {
    startIndex: Math.max(0, chartData.length - 30),
    endIndex: chartData.length - 1
  };
  
  const currentRangeLabel = chartData.length > 0 ? `${format(parseISO(chartData[0]?.date), "MMM d")} - ${format(parseISO(chartData[chartData.length - 1]?.date), "MMM d, yyyy")}`: "";


  return (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-muted-foreground w-48 text-center">{currentRangeLabel}</div>
                <Button variant="outline" size="icon" onClick={handleNext} disabled={isNextDisabled}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                {[7, 30, 90, 180].map((range) => (
                    <Button 
                        key={range}
                        variant={timeRange === range ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange(range as TimeRange)}
                    >
                        {range}d
                    </Button>
                ))}
            </div>
        </div>
        <div className="flex-1 min-h-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <AreaChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => format(parseISO(value), "MMM d")}
                    />
                    <YAxis 
                        dataKey="duration"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={yAxisDomain}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        cursor={true}
                        content={<ChartTooltipContent
                            labelFormatter={(label) => format(parseISO(label), 'eeee, MMM d')}
                            formatter={(value) => `${value} min`}
                            indicator="line"
                        />}
                    />
                    <defs>
                        <linearGradient id="fillDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-duration)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-duration)"
                            stopOpacity={0.1}
                        />
                        </linearGradient>
                    </defs>
                    <Area
                        dataKey="duration"
                        type="natural"
                        fill="url(#fillDuration)"
                        stroke="var(--color-duration)"
                        stackId="a"
                    />
                     <Brush
                      dataKey="date"
                      height={30}
                      stroke="hsl(var(--primary))"
                      startIndex={brushDomain.startIndex}
                      endIndex={brushDomain.endIndex}
                      tickFormatter={(value) => format(parseISO(chartData[value as number]?.date || new Date()), "MMM")}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    </div>
  )
}
