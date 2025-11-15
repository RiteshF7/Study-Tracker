
'use client';

import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

type Item = {
    id: string;
    content: string;
};

type Column = {
    id: string;
    title: string;
    items: Item[];
}

type Columns = {
  subjects: Column;
  RED: Column;
  YELLOW: Column;
  GREEN: Column;
};

const columnColors = {
  RED: 'bg-red-500/10 border-red-500/50',
  YELLOW: 'bg-yellow-500/10 border-yellow-500/50',
  GREEN: 'bg-green-500/10 border-green-500/50',
  subjects: 'bg-muted/50 border-border',
};

const columnTitleColors = {
    RED: 'text-red-500',
    YELLOW: 'text-yellow-500',
    GREEN: 'text-green-500',
    subjects: 'text-muted-foreground',
}


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

  const [columns, setColumns] = useLocalStorage<Columns>('sorting-columns-state', {
    subjects: { id: 'subjects', title: 'All Subjects', items: [] },
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
          ...newColumns.subjects.items,
          ...newColumns.RED.items,
          ...newColumns.YELLOW.items,
          ...newColumns.GREEN.items,
        ];

        const newSubjects = allSubjects.filter(
          (subject) => !allItemsInColumns.find((item) => item.id === subject.id)
        );

        newColumns.subjects.items = [...newColumns.subjects.items, ...newSubjects];
        
        // Remove subjects that no longer exist in activities
        Object.keys(newColumns).forEach(columnId => {
            (newColumns[columnId as keyof Columns] as Column).items = (newColumns[columnId as keyof Columns] as Column).items.filter(item => allSubjects.some(s => s.id === item.id));
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

    if (sourceDroppableId === destinationDroppableId) {
      // Reordering within the same column
      const column = columns[sourceDroppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [sourceDroppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    } else {
      // Moving between columns
      const sourceColumn = columns[sourceDroppableId];
      const destColumn = columns[destinationDroppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [sourceDroppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destinationDroppableId]: {
          ...destColumn,
          items: destItems,
        },
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">Sorting</h1>
      <p className="text-muted-foreground mb-6">
        Drag and drop your subjects to categorize them by confidence level.
      </p>
      {isClient ? (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId}>
              <Droppable droppableId={columnId} key={columnId}>
                {(provided, snapshot) => (
                  <Card
                    className={cn(
                      'transition-colors',
                      columnColors[columnId as keyof typeof columnColors],
                      snapshot.isDraggingOver && 'bg-primary/10'
                    )}
                  >
                    <CardHeader>
                      <CardTitle className={cn("text-lg font-semibold flex items-center justify-between", columnTitleColors[columnId as keyof typeof columnTitleColors])}>
                        {column.title}
                        <span className="text-sm font-normal bg-card text-muted-foreground rounded-full px-2 py-0.5">{column.items.length}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[200px] space-y-2 p-4 pt-0"
                    >
                      {isLoading && columnId === 'subjects' ? (
                         <p className="text-sm text-center text-muted-foreground py-8">Loading subjects...</p>
                      ) : column.items.length === 0 ? (
                         <div className="flex items-center justify-center h-full min-h-[150px]">
                             <p className="text-sm text-muted-foreground/70">Drop subjects here</p>
                         </div>
                      ) : (
                        column.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'p-3 rounded-lg bg-card shadow-sm border select-none flex items-center gap-2',
                                  snapshot.isDragging && 'shadow-lg ring-2 ring-primary'
                                )}
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                                <span className="font-medium text-sm">{item.content}</span>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
