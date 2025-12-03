
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { arrayMove } from '@dnd-kit/sortable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SYLLABUS, CourseType, YearType } from '@/constants/syllabus';

export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useLocalStorage<CourseType>('selected-course', 'JEE');
  const [year, setYear] = useLocalStorage<string>('selected-year', '11th');
  // activeSet now represents the Subject Name (e.g., "Physics", "Anatomy")
  const [activeSubject, setActiveSubject] = useState<string>('');

  // Get available subjects for the current course and year
  const availableSubjects = useMemo(() => {
    // @ts-ignore
    const courseData = SYLLABUS[course];
    if (!courseData) return [];

    // @ts-ignore
    const yearData = courseData[year];
    if (!yearData) return [];

    return Object.keys(yearData);
  }, [course, year]);

  // Set default subject when available subjects change
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(activeSubject)) {
      setActiveSubject(availableSubjects[0]);
    }
  }, [availableSubjects, activeSubject]);

  const currentTopics = useMemo(() => {
    // @ts-ignore
    const courseData = SYLLABUS[course];
    if (!courseData) return [];
    // @ts-ignore
    const yearData = courseData[year];
    if (!yearData) return [];

    return yearData[activeSubject] || [];
  }, [course, year, activeSubject]);

  const [columns, setColumns] = useLocalStorage<Columns>(`sorting-columns-${course}-${year}-${activeSubject}`, {
    RED: { id: 'RED', title: 'RED', items: [] },
    YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
    GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
  });

  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);

    // If columns are empty (new subject/year), populate RED with all topics
    // We check if all columns are empty to decide if we should initialize
    const isEmpty = columns.RED.items.length === 0 && columns.YELLOW.items.length === 0 && columns.GREEN.items.length === 0;

    if (isEmpty && currentTopics.length > 0) {
      setColumns({
        RED: { id: 'RED', title: 'RED', items: currentTopics.map((s: string) => ({ id: s, content: s })) },
        YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
        GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
      });
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, year, activeSubject, currentTopics]);

  const findContainer = (id: string, cols: Columns): keyof Columns | undefined => {
    if (id in cols) {
      return id as keyof Columns;
    }

    return (Object.keys(cols) as (keyof Columns)[]).find((key) =>
      cols[key].items.some((item) => item.id === id)
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((prevColumns) => {
      const activeContainerKey = findContainer(activeId, prevColumns);
      const overContainerKey = findContainer(overId, prevColumns);

      if (!activeContainerKey || !overContainerKey) {
        return prevColumns;
      }

      const newColumns = { ...prevColumns };

      if (activeContainerKey === overContainerKey) {
        // Reordering within the same column
        const activeContainer = newColumns[activeContainerKey];
        const oldIndex = activeContainer.items.findIndex((item) => item.id === activeId);
        const newIndex = activeContainer.items.findIndex((item) => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          newColumns[activeContainerKey] = {
            ...activeContainer,
            items: arrayMove(activeContainer.items, oldIndex, newIndex),
          };
        }
      } else {
        // Moving to a different column
        const activeContainer = newColumns[activeContainerKey];
        const overContainer = newColumns[overContainerKey];
        const activeIndex = activeContainer.items.findIndex((item) => item.id === activeId);
        if (activeIndex === -1) return prevColumns;

        const [movedItem] = activeContainer.items.splice(activeIndex, 1);

        // Find the index to insert at in the new column
        let overIndex = overContainer.items.findIndex((item) => item.id === overId);

        // If dropping on a container but not on a specific item, append to the end.
        if (over.data.current?.sortable.containerId === overId && overIndex === -1) {
          overIndex = overContainer.items.length;
        }

        if (overIndex !== -1) {
          overContainer.items.splice(overIndex, 0, movedItem);
        } else {
          // Default to appending if index is still not found (e.g., empty container)
          newColumns[overContainerKey].items.push(movedItem);
        }
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Course: {course}</span>
            <span className="text-sm font-medium text-muted-foreground">Year: {year}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'}>
            Change in Settings
          </Button>
        </div>

        <div className="grid gap-2">
          <Label className="mb-2 block">Subject</Label>
          <div className="flex flex-wrap items-center gap-2">
            {availableSubjects.map((subject) => (
              <Button
                key={subject}
                variant={activeSubject === subject ? 'default' : 'outline'}
                onClick={() => setActiveSubject(subject)}
              >
                {subject}
              </Button>
            ))}
          </div>
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
