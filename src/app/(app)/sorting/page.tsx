
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const [course] = useLocalStorage('selected-course', 'JEE');
  const [activeSet, setActiveSet] = useState('1');
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

  const [columns, setColumns] = useLocalStorage<Columns>(`sorting-columns-set-${activeSet}`, {
    RED: { id: 'RED', title: 'RED', items: [] },
    YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
    GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (allSubjects.length > 0 && isClient) {
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
  }, [allSubjects, isClient, activeSet]);

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
      <div className="mb-6">
          <Label htmlFor="subject-set" className="mb-2 block">Subject Set</Label>
          <div className="flex items-center gap-2">
            <Button variant={activeSet === '1' ? 'default' : 'outline'} onClick={() => setActiveSet('1')}>Physics</Button>
            <Button variant={activeSet === '2' ? 'default' : 'outline'} onClick={() => setActiveSet('2')}>Chemistry</Button>
            <Button variant={activeSet === '3' ? 'default' : 'outline'} onClick={() => setActiveSet('3')}>
              {course === 'JEE' ? 'Maths' : 'Biology'}
            </Button>
          </div>
      </div>
      {isClient ? (
        <SortingBoard columns={columns} onDragEnd={onDragEnd} isLoading={isLoading} />
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
