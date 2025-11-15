
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
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

  const [columns, setColumns] = useLocalStorage<Columns>('sorting-columns-state-v3', {
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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumnId = active.data.current?.sortable.containerId as keyof Columns;
    const destColumnId = over.id as keyof Columns;
    const draggedItemId = active.id as string;

    setColumns((prev) => {
        const newColumns = { ...prev };
        const sourceColumn = newColumns[sourceColumnId];
        const destColumn = newColumns[destColumnId];

        const sourceItems = [...sourceColumn.items];
        const destItems = sourceColumnId === destColumnId ? sourceItems : [...destColumn.items];

        const draggedItemIndex = sourceItems.findIndex(item => item.id === draggedItemId);
        const [removed] = sourceItems.splice(draggedItemIndex, 1);
        
        // Find the index to insert in the destination column
        const overItem = destColumn.items.find(item => item.id === over.id);
        const destIndex = overItem ? destItems.findIndex(item => item.id === over.id) : destItems.length;
        
        destItems.splice(destIndex, 0, removed);

        newColumns[sourceColumnId] = { ...sourceColumn, items: sourceItems };
        newColumns[destColumnId] = { ...destColumn, items: destItems };
        
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
