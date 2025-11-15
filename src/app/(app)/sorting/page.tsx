
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { OnDragEndResponder } from 'react-beautiful-dnd';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';


export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const { user } = useFirebase();
  const activitiesQuery = useMemoFirebase(
    (fs) => (user ? query(collection(fs, 'users', user.uid, 'activities')) : null),
    [user]
  );
  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const allSubjects = useMemo(() => {
    if (!activities) return [];
    const uniqueSubjects = [...new Set(activities.map((a) => a.name))];
    return uniqueSubjects.map((subject) => ({ id: subject, content: subject }));
  }, [activities]);

  const [columns, setColumns] = useLocalStorage<Columns>('sorting-columns-state-v2', {
    RED: { id: 'RED', title: 'RED', items: [] },
    YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
    GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (allSubjects.length > 0) {
      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        const allItemsInColumns = [
          ...newColumns.RED.items,
          ...newColumns.YELLOW.items,
          ...newColumns.GREEN.items,
        ];

        const newSubjects = allSubjects.filter(
          (subject) => !allItemsInColumns.find((item) => item.id === subject.id)
        );

        // Add new subjects to the GREEN column by default
        newColumns.GREEN.items = [...newColumns.GREEN.items, ...newSubjects];
        
        // Remove subjects that no longer exist in the source
        Object.keys(newColumns).forEach(columnId => {
            (newColumns[columnId as keyof Columns]).items = (newColumns[columnId as keyof Columns]).items.filter(item => allSubjects.some(s => s.id === item.id));
        });

        return newColumns;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects]);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const sourceDroppableId = source.droppableId as keyof Columns;
    const destinationDroppableId = destination.droppableId as keyof Columns;

    setColumns((prev) => {
        const newColumns = { ...prev };
        const sourceColumn = newColumns[sourceDroppableId];
        const destColumn = newColumns[destinationDroppableId];
        const sourceItems = [...sourceColumn.items];
        const destItems = sourceDroppableId === destinationDroppableId ? sourceItems : [...destColumn.items];

        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);

        newColumns[sourceDroppableId] = { ...sourceColumn, items: sourceItems };
        newColumns[destinationDroppableId] = { ...destColumn, items: destItems };
        
        return newColumns;
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">Sorting</h1>
      <p className="text-muted-foreground mb-6">
        Drag and drop your subjects to categorize them by confidence level.
      </p>
      {isClient ? (
        <SortingBoard columns={columns} onDragEnd={onDragEnd} isLoading={isLoading} />
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
