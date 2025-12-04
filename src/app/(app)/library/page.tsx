"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LIBRARY_DATA, SubjectResources } from "@/constants/library-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, BookCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LibraryPage() {
    const [course, setCourse] = useLocalStorage("selected-course", "JEE");
    const [year, setYear] = useLocalStorage("selected-year", "11th");
    const [activeSubject, setActiveSubject] = useState<string>("");

    // Get available subjects for the current course and year
    const availableSubjects = useMemo(() => {
        // @ts-ignore
        const courseData = LIBRARY_DATA[course];
        if (!courseData) return [];

        // @ts-ignore
        const yearData = courseData[year];
        if (!yearData) return [];

        return Object.keys(yearData);
    }, [course, year]);

    // Set default subject
    useEffect(() => {
        if (availableSubjects.length > 0 && !availableSubjects.includes(activeSubject)) {
            setActiveSubject(availableSubjects[0]);
        }
    }, [availableSubjects, activeSubject]);

    // Get resources for the active subject
    const resources: SubjectResources | null = useMemo(() => {
        // @ts-ignore
        const courseData = LIBRARY_DATA[course];
        if (!courseData) return null;
        // @ts-ignore
        const yearData = courseData[year];
        if (!yearData) return null;

        return yearData[activeSubject] || null;
    }, [course, year, activeSubject]);

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Library</h1>
                <p className="text-muted-foreground">
                    Access textbooks, exemplar problems, and solutions for your course.
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-6">
                        <div className="grid gap-2">
                            <Label>Course</Label>
                            <Select onValueChange={(val) => {
                                setCourse(val);
                                setYear(val === 'BPT' ? '1st Year' : '11th');
                            }} value={course}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="JEE">JEE</SelectItem>
                                    <SelectItem value="NEET">NEET</SelectItem>
                                    <SelectItem value="BPT">BPT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Year / Class</Label>
                            <Select onValueChange={setYear} value={year}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {course === 'BPT' ? (
                                        <>
                                            <SelectItem value="1st Year">1st Year</SelectItem>
                                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                                            <SelectItem value="4th Year">4th Year</SelectItem>
                                            <SelectItem value="5th Year">5th Year</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="11th">11th</SelectItem>
                                            <SelectItem value="12th">12th</SelectItem>
                                            <SelectItem value="Dropper">Dropper</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subject Tabs */}
            {availableSubjects.length > 0 ? (
                <Tabs value={activeSubject} onValueChange={setActiveSubject} className="w-full">
                    <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
                        {availableSubjects.map((subject) => (
                            <TabsTrigger
                                key={subject}
                                value={subject}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-card hover:bg-accent transition-all"
                            >
                                {subject}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={activeSubject} className="mt-6 space-y-8">
                        {resources ? (
                            <>
                                {/* NCERT Section */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="w-6 h-6 text-blue-500" />
                                        <h2 className="text-xl font-semibold">NCERT Textbooks</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {resources.NCERT.map((item, i) => (
                                            <ResourceCard key={i} title={item.title} type="PDF" />
                                        ))}
                                    </div>
                                </section>

                                {/* Exemplar Section */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-6 h-6 text-purple-500" />
                                        <h2 className="text-xl font-semibold">Exemplar Problems</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {resources.Exemplar.map((item, i) => (
                                            <ResourceCard key={i} title={item.title} type="PDF" />
                                        ))}
                                    </div>
                                </section>

                                {/* Solutions Section */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookCheck className="w-6 h-6 text-green-500" />
                                        <h2 className="text-xl font-semibold">Solutions</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {resources.Solutions.map((item, i) => (
                                            <ResourceCard key={i} title={item.title} type="PDF" />
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                No resources found for this selection.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    Please select a valid course and year to view resources.
                </div>
            )}
        </div>
    );
}

function ResourceCard({ title, type }: { title: string; type: string }) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <span className="text-xs font-bold text-primary">{type}</span>
                    </div>
                    <span className="font-medium truncate">{title}</span>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <FileText className="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
