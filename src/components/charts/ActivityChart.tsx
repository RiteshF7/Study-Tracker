"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityData {
    name: string;
    minutes: number;
}

interface ActivityChartProps {
    data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    const { theme } = useTheme();

    const chartColor = useMemo(() => {
        if (theme === 'matrix-dark') return '#22c55e'; // green-500
        if (theme === 'disney-dark') return '#fbbf24'; // amber-400
        if (theme === 'sunset') return '#f97316'; // orange-500
        if (theme === 'latte') return '#78350f'; // amber-900
        return '#8b5cf6'; // violet-500 (default)
    }, [theme]);

    return (
        <Card className="h-full border-none bg-transparent shadow-none">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}m`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
