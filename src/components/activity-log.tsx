
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
import { collection, doc, query, orderBy } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Badge } from "./ui/badge";

export function ActivityLog() {
  const { firestore, user } = useFirebase();
  
  const activitiesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const activitiesCollection = collection(firestore, "users", user.uid, "activities");
    return query(activitiesCollection, orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  function deleteActivity(id: string) {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "activities", id);
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
              <TableHead>Category</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading activities...
                </TableCell>
              </TableRow>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell><Badge variant="secondary">{activity.type}</Badge></TableCell>
                  <TableCell>{activity.category || 'N/A'}</TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
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
