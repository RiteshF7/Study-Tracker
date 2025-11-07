
"use client";

import { useMemo } from "react";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { subDays } from "date-fns";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export function ActivityLog() {
  const { firestore, user } = useFirebase();
  
  const activitiesCollection = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "activities") : null
  , [firestore, user]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesCollection);

  function deleteActivity(id: string) {
    if (!activitiesCollection) return;
    const docRef = doc(activitiesCollection, id);
    deleteDocumentNonBlocking(docRef);
  }

  const recentActivities = useMemo(() => {
    if (!activities) return [];
    
    const oneMonthAgo = subDays(new Date(), 30);
    
    return activities.filter(activity => {
      const activityDate = activity.createdAt?.toDate?.();
      return activityDate ? activityDate > oneMonthAgo : true;
    });
  }, [activities]);
  
  const sortedActivities = useMemo(() => {
    if (!recentActivities) return [];
    return [...recentActivities].sort((a, b) => {
        const timeA = a.createdAt?.toDate?.().getTime() || 0;
        const timeB = b.createdAt?.toDate?.().getTime() || 0;
        return timeB - timeA;
      })
  },[recentActivities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Past Activities</CardTitle>
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
                  No activities logged in the last 30 days.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
