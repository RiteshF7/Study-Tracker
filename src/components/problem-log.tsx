
"use client";

import { useMemo } from "react";
import type { Problem } from "@/lib/types";
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

export function ProblemLog() {
  const { user, firestore } = useFirebase();
  
  const problemsQuery = useMemoFirebase((fs) => {
    if (!user) return null;
    const problemsCollection = collection(fs, "users", user.uid, "problems");
    return query(problemsCollection, orderBy("createdAt", "desc"));
  }, [user]);

  const { data: problems, isLoading } = useCollection<Problem>(problemsQuery);

  function deleteProblem(id: string) {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "problems", id);
    deleteDocumentNonBlocking(docRef);
  }

  const recentProblems = useMemo(() => {
    if (!problems) return [];
    
    const oneMonthAgo = subDays(new Date(), 30);
    
    return problems.filter(problem => {
      const problemDate = problem.createdAt?.toDate?.();
      return problemDate ? problemDate > oneMonthAgo : true;
    });
  }, [problems]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Past Problems Solved</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading problems...
                </TableCell>
              </TableRow>
            ) : recentProblems.length > 0 ? (
              recentProblems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>{problem.date}</TableCell>
                  <TableCell className="font-medium">{problem.name}</TableCell>
                  <TableCell><Badge variant="secondary">{problem.category}</Badge></TableCell>
                  <TableCell>{problem.count}</TableCell>
                  <TableCell>{problem.notes || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteProblem(problem.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No problems logged in the last 30 days.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
