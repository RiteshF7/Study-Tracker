
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Brush } from "recharts"
import { format, subDays, startOfDay, parseISO } from "date-fns"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Activity } from "@/lib/types"
import { Button } from "./ui/button"

type TimeRange = 7 | 30 | 90 | 180;

interface FocusChartProps {
    activities: Activity[];
}

export function FocusChart({ activities }: FocusChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(30);

  const chartData = React.useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, timeRange - 1));
    
    const dataMap = new Map<string, number>();

    // Initialize all days in the range with 0 duration
    for (let i = 0; i < timeRange; i++) {
        const date = subDays(endDate, i);
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
    
  }, [activities, timeRange]);

  const chartConfig = {
    duration: {
      label: "Duration (min)",
      color: "hsl(var(--primary))",
    },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];

  const yAxisDomain = [0, Math.max(240, ...chartData.map(d => d.duration))];
  const brushDomain = {
    startIndex: Math.max(0, chartData.length - 30),
    endIndex: chartData.length -1
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-end gap-2 mb-4">
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
        <div className="flex-1 min-h-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={chartData}>
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
                        cursor={false}
                        content={<ChartTooltipContent
                            labelFormatter={(label) => format(parseISO(label), 'eeee, MMM d')}
                            formatter={(value) => `${value} min`}
                            indicator="dot"
                        />}
                    />
                    <Bar dataKey="duration" fill="var(--color-duration)" radius={4} />
                    <Brush
                      dataKey="date"
                      height={30}
                      stroke="hsl(var(--primary))"
                      startIndex={brushDomain.startIndex}
                      endIndex={brushDomain.endIndex}
                      tickFormatter={(value) => format(parseISO(chartData[value as number]?.date || new Date()), "MMM")}
                    />
                </BarChart>
            </ChartContainer>
        </div>
    </div>
  )
}
