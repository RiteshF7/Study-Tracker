
"use client";

import { useState, useMemo } from "react";
import type { Activity } from "@/lib/types";
import { courses, defaultSubjects, CourseName, YearName } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Trash2, ListFilter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useCollection, useFirebase, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type UserProfile = {
  course?: CourseName;
  year?: string;
}

export function ActivityLog() {
  const { firestore, user } = useFirebase();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const userDocRef = useMemoFirebase(() =>
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesCollection);

  const problemSubjects = useMemo(() => {
    const courseName = userProfile?.course;
    const yearName = userProfile?.year;
    
    if (courseName && courses[courseName]) {
      const courseData = courses[courseName];
      if (yearName && courseData[yearName as keyof typeof courseData]) {
        return courseData[yearName as keyof typeof courseData];
      }
      return Object.values(courseData).flat();
    }
    
    return defaultSubjects;
  }, [userProfile]);

  function deleteActivity(id: string) {
    if (!activitiesCollection) return;
    const docRef = doc(activitiesCollection, id);
    deleteDocumentNonBlocking(docRef);
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };
  
  const handleClearFilters = () => {
    setSelectedSubjects([]);
  };

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (selectedSubjects.length === 0) return activities;
    return activities.filter(activity => 
      selectedSubjects.some(subject => activity.name.toLowerCase().includes(subject.toLowerCase()))
    );
  }, [activities, selectedSubjects]);
  
  const sortedActivities = useMemo(() => {
    if (!filteredActivities) return [];
    return [...filteredActivities].sort((a, b) => {
        const timeA = a.createdAt?.toDate?.().getTime() || 0;
        const timeB = b.createdAt?.toDate?.().getTime() || 0;
        return timeB - timeA;
      })
  },[filteredActivities]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <CardTitle>Your Past Activities</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter by Subject ({selectedSubjects.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by subject</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {selectedSubjects.length > 0 && (
                <>
                  <DropdownMenuItem
                    onSelect={handleClearFilters}
                    className="text-destructive focus:text-destructive"
                  >
                    Clear filters
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {problemSubjects.map((subject) => (
                <DropdownMenuCheckboxItem
                  key={subject}
                  checked={selectedSubjects.includes(subject)}
                  onCheckedChange={() => handleSubjectChange(subject)}
                >
                  {subject}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading activities...
                </TableCell>
              </TableRow>
            ) : sortedActivities.length > 0 ? (
              sortedActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteActivity(activity.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No activities logged yet. Use the timer above to start tracking!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
