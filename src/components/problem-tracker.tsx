
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
import { Trash2 } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { ProblemForm } from "./problem-form";
import { PlusCircle } from "lucide-react";

export function ProblemTracker() {
  const { firestore, user } = useFirebase();

  const problemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const problemsCollection = collection(firestore, "users", user.uid, "problems");
    return query(problemsCollection, orderBy("createdAt", "desc"));
  },[firestore, user]);

  const { data: problems, isLoading } = useCollection<Problem>(problemsQuery);

  function deleteProblem(id: string) {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "problems", id);
    deleteDocumentNonBlocking(docRef);
  }

  return (
    <>
      <div className="flex flex-row items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">Your Problems</h2>
          <ProblemForm triggerButton={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Track Problems
            </Button>
          } />
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name / Topic</TableHead>
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
              ) : problems && problems.length > 0 ? (
                problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell>{problem.date}</TableCell>
                    <TableCell className="font-medium">{problem.name}</TableCell>
                    <TableCell>{problem.category}</TableCell>
                    <TableCell>{problem.count}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{problem.notes}</TableCell>
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
                    No problems tracked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    </>
  );
}
