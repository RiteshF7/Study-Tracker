
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


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
    if (!over) return;
  
    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;
  
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
  
    setColumns((prev) => {
      const activeItems = prev[activeContainer as keyof Columns].items;
      const overItems = prev[overContainer as keyof Columns].items;
  
      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === over.id);
  
      const newColumns = { ...prev };
  
      const [removed] = newColumns[activeContainer as keyof Columns].items.splice(activeIndex, 1);
  
      if (over.id in newColumns) {
        // Dropping in a new column
         newColumns[over.id as keyof Columns].items.push(removed);
      } else {
        // Dropping on an item in a new column
         newColumns[overContainer as keyof Columns].items.splice(overIndex, 0, removed);
      }
      
      return newColumns;
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">Sorting</h1>
      <p className="text-muted-foreground mb-6">
        Drag and drop your subjects to categorize them by confidence level.
      </p>
      <div className="mb-6 max-w-xs">
          <Label htmlFor="subject-set">Subject Set</Label>
          <Select defaultValue="1">
              <SelectTrigger id="subject-set">
                  <SelectValue placeholder="Select a set" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="1">Subject Set 1</SelectItem>
                  <SelectItem value="2">Subject Set 2</SelectItem>
                  <SelectItem value="3">Subject Set 3</SelectItem>
              </SelectContent>
          </Select>
      </div>
      {isClient ? (
        <SortingBoard columns={columns} onDragEnd={onDragEnd} isLoading={isLoading} />
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
